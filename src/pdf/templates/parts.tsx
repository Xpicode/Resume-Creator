import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ViewSection } from "@/features/resume/view";

// Shared building blocks. Real text only, standard headings, no icons or tables (plan 5.5).

export const base = StyleSheet.create({
  page: {
    paddingVertical: 36,
    paddingHorizontal: 42,
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#111111",
  },
  name: { fontSize: 20, fontWeight: 700, lineHeight: 1.2 },
  headline: { fontSize: 11, marginTop: 2 },
  muted: { color: "#444444" },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: "#888888",
    paddingBottom: 2,
  },
  item: { marginTop: 5 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontWeight: 700 },
  bulletRow: { flexDirection: "row", marginLeft: 8 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  link: { color: "#111111", textDecoration: "none" },
});

export function Sections({ sections, accent }: { sections: ViewSection[]; accent?: string }) {
  return (
    <>
      {sections.map((section, i) => (
        <View key={i}>
          {/* Keep a heading with at least the start of its section. */}
          <Text
            style={[base.sectionTitle, accent ? { color: accent, borderBottomColor: accent } : {}]}
            minPresenceAhead={40}
          >
            {section.title}
          </Text>
          {section.note && <Text>{section.note}</Text>}
          {section.inline && <Text>{section.inline}</Text>}
          {section.items.map((item, j) => (
            <View key={j} style={base.item} wrap={item.bullets.length > 4}>
              {(item.title || item.dates) && (
                <View style={base.row}>
                  <Text style={[base.bold, { flex: 1 }]}>{item.title}</Text>
                  {item.dates && <Text style={{ marginLeft: 8 }}>{item.dates}</Text>}
                </View>
              )}
              {item.subtitle && <Text style={base.muted}>{item.subtitle}</Text>}
              {item.lines.map((line, k) =>
                /^https?:\/\//.test(line) ? (
                  <Link key={k} src={line} style={base.link}>
                    {line}
                  </Link>
                ) : (
                  <Text key={k}>{line}</Text>
                ),
              )}
              {item.bullets.map((b, k) => (
                <View key={k} style={base.bulletRow}>
                  <Text style={base.bulletDot}>•</Text>
                  <Text style={base.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}
