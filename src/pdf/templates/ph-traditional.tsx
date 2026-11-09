import { Image, Link, Page, Text, View } from "@react-pdf/renderer";
import type { TemplateProps } from "../render";
import { base, Sections } from "./parts";

const ACCENT = "#1e3a8a";
// 1.15 x 1.15 inches: a 2x2 photo at full size crowded the header. ponytail: fixed size, make it a setting if users ask.
const PHOTO_SIZE = 83; // 72pt = 1 inch

/** Header with a 2x2 photo and a personal details block, for walk-in and printed applications. */
export function PhTraditional({ view, paperSize, photo }: TemplateProps) {
  return (
    <Page size={paperSize} style={base.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={[base.name, { color: ACCENT }]}>{view.name || "Your Name"}</Text>
          {view.headline && <Text style={base.headline}>{view.headline}</Text>}
          <View style={{ marginTop: 6 }}>
            {view.contacts.map((c, i) => (
              <Text key={i}>{c}</Text>
            ))}
            {view.links.map((l, i) => (
              <Link key={i} src={l.url} style={base.link}>
                {l.label ? `${l.label}: ${l.url}` : l.url}
              </Link>
            ))}
          </View>
          {view.details.length > 0 && (
            <View style={{ marginTop: 6 }}>
              {view.details.map(([k, v]) => (
                <View key={k} style={{ flexDirection: "row" }}>
                  <Text style={[base.bold, { width: 80 }]}>{k}:</Text>
                  <Text>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {photo && (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt; the PDF is not a web page
          <Image
            src={{ data: photo, format: "jpg" }}
            style={{
              width: PHOTO_SIZE,
              height: PHOTO_SIZE,
              borderWidth: 0.75,
              borderColor: "#cbd5e1",
            }}
          />
        )}
      </View>
      <Sections sections={view.sections} accent={ACCENT} />
    </Page>
  );
}
