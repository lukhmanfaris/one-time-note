export function StatsBar() {
  const stats = [
    { value: "256", label: "Bit Encryption" },
    { value: "0", label: "Data Stored" },
    { value: "1", label: "Time Read Only" },
  ];

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-12 border-t border-b">
      <div className="grid grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
