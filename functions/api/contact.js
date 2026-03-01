export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, email, message, turnstileToken } = body;

    if (!name || !email || !message || !turnstileToken) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Verify Turnstile
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET);
    formData.append("response", turnstileToken);

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return new Response(JSON.stringify({ error: "Bot validation failed" }), { status: 400 });
    }

    // Store message in D1
    await env.DB.prepare(
      "INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(name, email, message).run();

    // Send notification email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Contact <no-reply@thecrystalcardkeep.com>",
        to: "chris.waldron319@thecrystalcardkeep.com",
        subject: "New Contact Message",
        html:
          "<strong>Name:</strong> " + name +
          "<br/><strong>Email:</strong> " + email +
          "<br/><br/>" + message
      })
    });

    if (!emailRes.ok) {
      return new Response(JSON.stringify({ error: "Email send failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
