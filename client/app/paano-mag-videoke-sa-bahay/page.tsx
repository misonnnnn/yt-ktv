import type { Metadata } from "next";
import { relatedLinksExcept, SeoPage } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Paano mag-videoke sa bahay nang walang machine",
  description:
    "Paano mag-videoke sa bahay nang walang machine. Gamitin ang TV o laptop, i-scan ang QR, at pumili ng kanta sa phone — online karaoke sa bahay, libre sa browser.",
  alternates: {
    canonical: "/paano-mag-videoke-sa-bahay",
  },
  openGraph: {
    title: "Paano mag-videoke sa bahay nang walang machine | TaraSing",
    description:
      "Online karaoke sa bahay gamit ang TV at mga phone ng barkada. Walang videoke machine at walang app na ida-download.",
    url: "/paano-mag-videoke-sa-bahay",
  },
};

const faqs = [
  {
    question: "Kailangan ba ng videoke machine?",
    answer:
      "Hindi. Sapat na ang TV o laptop, speaker, at phone ng barkada. Si TaraSing ang pila ng kanta at ang screen ng lyrics.",
  },
  {
    question: "May ida-download bang app?",
    answer:
      "Wala. Browser lang ang gagamitin sa TV, laptop, at phone. Walang App Store at walang Google Play.",
  },
  {
    question: "Paano kung ayaw gumana ang browser ng smart TV?",
    answer:
      "Ikabit ang laptop sa TV gamit ang HDMI at doon buksan ang TaraSing. Ang paghahanap ng kanta ay sa phone pa rin, hindi sa remote.",
  },
  {
    question: "Saan nanggagaling ang mga kanta?",
    answer:
      "Sa YouTube karaoke videos. I-search ang title sa phone, idagdag sa queue, at tutugtog ito sa host screen.",
  },
  {
    question: "Libre ba ito?",
    answer:
      "Oo. Puwede kang gumawa ng party at kumanta kasama ang barkada nang walang subscription.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function PaanoMagVideokeSaBahayPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SeoPage
        h1="Paano mag-videoke sa bahay nang walang machine"
        intro="Gusto mong mag-videoke sa bahay pero wala kang machine, disc, o USB ng kanta? Puwede na ang online karaoke sa bahay gamit ang TV o laptop na nandiyan na, at ang mga phone ng barkada. Si TaraSing ang hawak ng pila. Bubuksan mo ang site sa malaking screen, ise-share ang QR, at doon na pipili ang mga kanta. Walang app na ida-download, at walang rentang videoke player."
        ctaLabel="Gumawa ng videoke party"
        faqHeading="Mga tanong"
        relatedHeading="Iba pang gabay"
        joinHint="O"
        joinLabel="sumali sa party na bukas na"
        sections={[
          {
            heading: "Ano ang kailangan mo sa bahay",
            paragraphs: [
              "Tatlong bagay lang ang kailangan bago tumawag ng tao. Una, isang screen na kita ng lahat: smart TV na may browser, laptop na naka-HDMI sa TV, o tablet na naka-stand sa mesa. Doon tutugtog ang lyrics. Pangalawa, tunog. Sapat ang speaker ng TV sa condo. Mas masaya kung may soundbar, basta maririnig ang kanta sa buong sala. Pangatlo, phone ng bawat bisita, at internet sa screen at sa mga phone.",
              "Hindi mo kailangan ng videoke box, songbook, o remote na pagti-type-an ng title. Kung may extra mic kayo, dalhin ninyo. Kung wala, puwede pa ring kumanta sa harap ng TV. Ang mic ay bonus. Ang kailangan ay screen, tunog, at paraan para pumila ang kanta nang hindi pinapasa ang isang phone.",
            ],
          },
          {
            heading: "Online karaoke sa bahay, hakbang-hakbang",
            paragraphs: [
              "Ito ang pagkakasunod kapag bigla na lang may nagsabing tara, videoke. Buksan ang TaraSing sa screen na pang-host. Huwag gawing stage ang phone ng isa. Maliit ang lyrics, at mahihinto ang kanta sa tuwing may hahanap ng susunod. Ang TV o laptop ang stage. Ang mga phone ang remote.",
              "Pindutin ang Create Party. Lagyan ng pangalan ng gabi, halimbawa Friday sa sala, at ilagay ang nickname mo bilang host. Lalabas ang party code at ang QR. Iwanang kita ang QR habang may kumakanta, para makapasok ang mga late nang hindi iniistorbo ang tumutugtog.",
              "I-scan ng barkada ang QR gamit ang camera ng phone. Maglalagay sila ng pangalan. Walang account at walang password. Kung ayaw mag-scan, puwede nilang buksan ang site at i-type ang code. Sa phone na iyon magse-search: i-type ang title at ang salitang karaoke, piliin ang version, tapos idagdag sa queue.",
              "Ang kanta ay lalabas sa TV. Habang kumakanta ang isa, puwede nang humanap ang susunod, kaya hindi na ipapasa ang isang phone sa buong sofa. Kapag tapos ang kanta, sunod na sa queue ang tutugtog. Ang host puwedeng mag-skip kung mali ang version o kung ayaw na ng kumakanta. Iyan na ang buong online karaoke sa bahay: isang screen, isang QR, at pila na hawak ng lahat.",
            ],
          },
          {
            heading: "Kapag masakit mag-type sa remote ng TV",
            paragraphs: [
              "Maraming smart TV ang may browser, pero masakit ang on-screen keyboard. Huwag mo nang gamitin iyon para maghanap ng kanta. Ang hanap ay sa phone. Ang TV ay panonood lang, kaya kahit bagal ang remote ay hindi na hadlang pagkatapos mong buksan ang party.",
              "Kung bagal o sira ang browser ng TV, mas sigurado ang laptop. Buksan ang TaraSing doon, ikabit sa TV gamit ang HDMI, at gawing source ng TV ang laptop. Ang tunog ay sa TV o sa soundbar na naka-kabit na rito. Iwanang gising ang laptop hanggang matapos ang gabi, para hindi mamatay ang screen sa gitna ng chorus.",
              "Subukan ang isang kanta bago dumating ang bisita. Tignan ang volume, ang Wi-Fi, at kung kita ang lyrics mula sa sofa. Limang minutong sound check ang nakakapagligtas sa unang kantang paulit-ulit na “teka, ang hina.”",
            ],
          },
          {
            heading: "Para hindi masira ang pila",
            paragraphs: [
              "Ang pinakamabilis na paraan para mainis ang barkada ay isang tao na sunod-sunod ang limang kanta. Sabihin sa simula: isa o dalawang kanta muna bawat tao, tapos balik sa pila. Kita ng lahat ang queue sa phone nila, kaya halata kung sino ang nag-ipon.",
              "Ang nahihiyang bisita ay puwedeng mag-add nang naka-upo. Hindi na kailangang tumayo sa TV at mag-type habang nakatingin ang lahat. Para sa duet, isang tao ang mag-a-add at dalawa ang kakanta. Kung may dumating na late, i-scan lang ang parehong QR. Hindi na kailangang i-restart ang party. Kung may umalis, puwedeng i-skip ng host ang kantang naiwan niya sa pila.",
            ],
          },
          {
            heading: "Anong kanta ang ise-search",
            paragraphs: [
              "Galing sa YouTube karaoke videos ang tugtog, kaya i-search ang kantang alam ng kwarto. OPM, Tagalog love songs, at ang English tracks na laging nalalabas tuwing birthday. Idagdag ang salitang karaoke sa search para lyrics version ang lumabas, hindi ang official music video.",
              "Kung unavailable ang unang video, piliin ang ibang upload ng parehong kanta. Maraming version ang isang hit. Puwede ring paghaluin ang henerasyon: isang OPM ballad, tapos isang party song, para hindi antukin ang mga hindi kumakanta. Hindi mo kailangang gumawa ng playlist bago ang gabi. Ang pila ang playlist, at nabubuo iyon habang tumatagal ang salu-salo.",
            ],
          },
          {
            heading: "Libre sa browser, hanggang matapos ang gabi",
            paragraphs: [
              "Ang paggawa ng party sa TaraSing ay libre. Walang bayad na app at walang pro unlock bago ka makakanta. Kailangan lang nakabukas ang host screen at may internet. Ang bisita puwedeng umalis saglit sa page at bumalik gamit ang code. Huwag i-close ang host tab, dahil doon tumutugtog ang kanta.",
              "Kapag tapos na ang gabi, iwanan na ang party. Sa susunod na Friday, gumawa ng bago. Iyan ang videoke sa bahay nang walang machine: screen na meron ka na, phone ng barkada, at isang QR.",
            ],
          },
        ]}
        faqs={faqs}
        relatedLinks={relatedLinksExcept("/paano-mag-videoke-sa-bahay")}
      />
    </>
  );
}
