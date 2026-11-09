import { Link, Page, Text, View } from "@react-pdf/renderer";
import type { TemplateProps } from "../render";
import { base, Sections } from "./parts";

/** Single column, no photo, standard headings — safest for JobStreet, Indeed and company portals. */
export function AtsClassic({ view, paperSize }: TemplateProps) {
  return (
    <Page size={paperSize} style={base.page}>
      <Text style={base.name}>{view.name || "Your Name"}</Text>
      {view.headline && <Text style={base.headline}>{view.headline}</Text>}
      {view.contacts.length > 0 && (
        <Text style={[base.muted, { marginTop: 4 }]}>{view.contacts.join(" | ")}</Text>
      )}
      {view.links.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {view.links.map((l, i) => (
            <Text key={i} style={base.muted}>
              {i > 0 ? " | " : ""}
              {l.label ? `${l.label}: ` : ""}
              <Link src={l.url} style={base.link}>
                {l.url}
              </Link>
            </Text>
          ))}
        </View>
      )}
      {view.details.length > 0 && (
        <Text style={[base.muted, { marginTop: 2 }]}>
          {view.details.map(([k, v]) => `${k}: ${v}`).join(" | ")}
        </Text>
      )}
      <Sections sections={view.sections} />
    </Page>
  );
}
