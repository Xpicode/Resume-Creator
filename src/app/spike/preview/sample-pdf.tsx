// THROWAWAY Phase 0 spike (plan 3.2). Do not reuse without review — real templates live in src/pdf/templates (Phase 1).
import "server-only";
import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const fontDir = path.join(process.cwd(), "src", "pdf", "fonts");
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontDir, "Inter-Regular.woff") },
    { src: path.join(fontDir, "Inter-Bold.woff"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", fontSize: 10, lineHeight: 1.4, color: "#111" },
  name: { fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  contact: { marginTop: 4, color: "#444" },
  h2: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    paddingBottom: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontWeight: 700 },
  bullet: { marginLeft: 10 },
});

function Item({
  title,
  place,
  dates,
  bullets,
}: {
  title: string;
  place: string;
  dates: string;
  bullets: string[];
}) {
  return (
    <View style={{ marginTop: 6 }}>
      <View style={s.row}>
        <Text style={s.bold}>{title}</Text>
        <Text>{dates}</Text>
      </View>
      <Text>{place}</Text>
      {bullets.map((b) => (
        <Text key={b} style={s.bullet}>
          • {b}
        </Text>
      ))}
    </View>
  );
}

function SampleResume() {
  return (
    <Document title="Peñaflorida_Juan_Resume" author="Spike">
      <Page size="A4" style={s.page}>
        <Text style={s.name}>Juan Peñaflorida</Text>
        <Text style={s.contact}>
          Santo Niño, Marikina City · juan.penaflorida@example.com · 0917 000 0000
        </Text>

        <Text style={s.h2}>Summary</Text>
        <Text>
          Information Technology graduate with hands-on OJT experience in IT support and a capstone
          project in inventory systems. Comfortable with customers, troubleshooting and teamwork.
        </Text>

        <Text style={s.h2}>Education</Text>
        <Item
          title="BS Information Technology"
          place="Pamantasan ng Lungsod ng Marikina"
          dates="Aug 2021 – Jun 2025"
          bullets={["Cum Laude", "Capstone: Barangay Supply Inventory System (Laravel, MySQL)"]}
        />

        <Text style={s.h2}>Internship (OJT)</Text>
        <Item
          title="IT Support Intern"
          place="City Hall IT Office, Marikina"
          dates="Feb 2025 – May 2025"
          bullets={[
            "Resolved 15+ hardware and network tickets per week for 120 employees",
            "Set up and imaged 40 new desktop computers before the fiscal year rollout",
            "Wrote a one-page printer troubleshooting guide used by the help desk",
          ]}
        />

        <Text style={s.h2}>Licenses & Eligibility</Text>
        <Text>Civil Service Professional — passed Mar 2025</Text>
        <Text>TESDA NC II – Computer Systems Servicing — 2024</Text>

        <Text style={s.h2}>Trainings & Seminars</Text>
        <Text>Cybersecurity Awareness Seminar — DICT, Oct 2024 (8 hours)</Text>
        <Text>Customer Service Excellence — Señor Niño Training Center, Jul 2024 (16 hours)</Text>

        <Text style={s.h2}>Skills</Text>
        <Text>
          Windows & hardware troubleshooting · Networking basics · MS Excel · Laravel · MySQL ·
          Filipino & English
        </Text>
      </Page>
    </Document>
  );
}

export function renderSamplePdf(): Promise<Buffer> {
  return renderToBuffer(<SampleResume />);
}
