import React from "react";

export default function Affiliates() {
    const affiliates = [
    {
      name: "PokePings Discord (Restock Alerts)",
      desc: "Real-time Pokémon restock/drop alerts + custom monitors across major retailers.",
      href: "https://whop.com/pokepings/?a=jeh319",
    },
    {
      name: "Whatnot — New Buyer ($15 credit)",
      desc: "Join Whatnot as a buyer and get $15 to spend on your first pickups.",
      href: "https://whatnot.com/invite/thecrystalcardkeep",
    },
    {
      name: "Whatnot — New Seller ($150 bonus)",
      desc: "Apply to sell on Whatnot and unlock the new-seller bonus (plus extra perks).",
      href: "https://whatnot.com/invite/seller/thecrystalcardkeep",
    },
    {
      name: "Mandingo6420 — Whatnot Stream",
      desc: "The Crystal Card Keep's very own Mandingo quickfiring off singles, slabs, and big hits!",
      href: "https://www.whatnot.com/user/mandingo6420?app=android&sender_id=22337761&sharing_channel=copylink",
    },
  ];

  return (
    <section className="hero affiliatesHero" aria-label="Affiliates">
      <div className="heroInner">
        <div className="heroLeft">
          <h1 className="heroTitle">Affiliates</h1>
          <p className="heroSubline">Restocks. Deals. Streams. All killer, no filler.</p>

          <div className="affiliatesList" role="list">
            {affiliates.map((a) => (
              <article className="affiliateCard" role="listitem" key={a.name}>
                <div className="affiliateMain">
                  <div className="affiliateName">{a.name}</div>
                  <div className="affiliateDesc">{a.desc}</div>
                </div>
                <a className="btn affiliateBtn" href={a.href}>
                  Visit
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



