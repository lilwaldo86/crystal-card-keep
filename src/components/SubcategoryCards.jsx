export default function SubcategoryCards() {
  const items = [
    { title: "Pokémon", desc: "Sealed + singles", href: "#pokemon" },
    { title: "One Piece", desc: "Hard-to-find drops", href: "#onepiece" },
    { title: "Singles", desc: "Chase + staples", href: "#singles" },
  ];

  return (
    <div className="subcats" aria-label="Popular categories">
      {items.map((it) => (
        <a key={it.title} className="subcat" href={it.href}>
          <div className="subcat__top">
            <span className="subcat__title">{it.title}</span>
            <span className="subcat__chev" aria-hidden="true">
              →
            </span>
          </div>
          <div className="subcat__desc">{it.desc}</div>
        </a>
      ))}
    </div>
  );
}
