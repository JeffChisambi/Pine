/**
 * The Market Fundamentals lessons, in English and Chichewa.
 *
 * Each lesson is a short sequence of segments the lesson screen "types" out
 * one at a time, the way a patient teacher would say one thing, wait, then
 * say the next. Segments are kept to two or three sentences on purpose: a
 * wall of text typed at reading speed is a wall of text with a delay.
 *
 * Both languages are written directly, not machine-translated. The Chichewa
 * uses everyday Lilongwe/Blantyre register and keeps the English financial
 * terms people actually use ("stock", "shares", "MSE") where a coined word
 * would be less clear than the loan word.
 */

export type LessonLanguage = "en" | "ny";

export interface LessonSegment {
  /** Optional short heading shown above the segment, in both languages. */
  heading?: Record<LessonLanguage, string>;
  text: Record<LessonLanguage, string>;
}

export interface Lesson {
  id: string;
  number: number;
  title: Record<LessonLanguage, string>;
  minutes: number;
  segments: LessonSegment[];
}

export const LANGUAGE_LABEL: Record<LessonLanguage, string> = {
  en: "English",
  ny: "Chichewa",
};

export const LESSONS: Lesson[] = [
  {
    id: "what-is-a-stock",
    number: 1,
    title: { en: "What Is a Stock?", ny: "Stock Ndi Chiyani?" },
    minutes: 3,
    segments: [
      {
        text: {
          en: "Imagine a company is a big cake. A stock is one slice of that cake. When you buy a stock, you own a small piece of the company.",
          ny: "Tiyerekeze kuti kampani ndi keke yaikulu. Stock ndi kagawo kamodzi ka keke imeneyo. Ukagula stock, umakhala ndi kachigawo kakang'ono ka kampaniyo.",
        },
      },
      {
        heading: { en: "Shares", ny: "Ma Shares" },
        text: {
          en: "Each slice is called a share. A company like Airtel Malawi has billions of shares, and anyone can buy some of them on the stock exchange.",
          ny: "Kagawo kalikonse kamatchedwa share. Kampani ngati Airtel Malawi ili ndi ma shares mabiliyoni ambiri, ndipo aliyense akhoza kugula ena mwa iwo pa stock exchange.",
        },
      },
      {
        heading: { en: "Why own one?", ny: "Chifukwa chiyani ugule?" },
        text: {
          en: "When the company does well, your slice becomes worth more. Some companies also share their profit with owners. That payment is called a dividend.",
          ny: "Kampani ikachita bwino, kagawo kako kamakwera mtengo. Makampani ena amagawananso phindu lawo ndi eni ake. Ndalama imeneyo imatchedwa dividend.",
        },
      },
      {
        text: {
          en: "That is the whole idea. You are not lending the company money. You are becoming one of its owners, even if only a very small one.",
          ny: "Ndiye maganizo onse. Sukubwereketsa kampani ndalama. Ukukhala mmodzi mwa eni ake, ngakhale kuti ndi kagawo kakang'ono kwambiri.",
        },
      },
    ],
  },
  {
    id: "how-the-exchange-works",
    number: 2,
    title: { en: "How the Stock Exchange Works", ny: "Momwe Stock Exchange Imagwirira Ntchito" },
    minutes: 4,
    segments: [
      {
        text: {
          en: "A stock exchange is a marketplace. Instead of tomatoes and maize, people buy and sell shares of companies there.",
          ny: "Stock exchange ndi msika. M'malo mwa tomato ndi chimanga, anthu amagula ndi kugulitsa ma shares a makampani kumeneko.",
        },
      },
      {
        heading: { en: "The MSE", ny: "MSE" },
        text: {
          en: "Malawi's marketplace is the Malawi Stock Exchange, or MSE, in Blantyre. Companies like NBM, FDH Bank, Illovo and TNM are listed there.",
          ny: "Msika wa Malawi ndi Malawi Stock Exchange, kapena MSE, ku Blantyre. Makampani ngati NBM, FDH Bank, Illovo ndi TNM ali pamenepo.",
        },
      },
      {
        heading: { en: "Brokers", ny: "Ma Broker" },
        text: {
          en: "You cannot walk into the exchange yourself. A licensed broker places orders for you. Pine connects you to a broker so you can trade from your phone.",
          ny: "Sungalowe mu exchange wekha. Broker wovomerezeka amakuyikira ma order. Pine imakulumikiza ndi broker kuti uzigula ndi kugulitsa kuchokera pa foni yako.",
        },
      },
      {
        heading: { en: "Matching", ny: "Kugwirizanitsa" },
        text: {
          en: "When someone wants to sell at a price and someone else wants to buy at that price, the exchange matches them. That is a trade.",
          ny: "Munthu akafuna kugulitsa pa mtengo wina, ndipo wina akafuna kugula pa mtengo womwewo, exchange imawagwirizanitsa. Imeneyo ndi trade.",
        },
      },
      {
        text: {
          en: "The MSE trades on weekdays. Orders you place in the evening or at the weekend wait for the next trading day.",
          ny: "MSE imagwira ntchito masiku a sabata. Ma order omwe uyika madzulo kapena kumapeto kwa sabata amadikira tsiku lotsatira la malonda.",
        },
      },
    ],
  },
  {
    id: "reading-stock-prices",
    number: 3,
    title: { en: "Reading Stock Prices", ny: "Kuwerenga Mitengo ya Ma Stock" },
    minutes: 3,
    segments: [
      {
        text: {
          en: "Every stock has a price. It is what the last buyer paid for one share. Prices on the MSE are shown in kwacha, and some are in tambala too.",
          ny: "Stock iliyonse ili ndi mtengo. Ndi zomwe wogula womaliza analipira pa share imodzi. Mitengo pa MSE imasonyezedwa mu kwacha, ndipo ina imakhala ndi tambala.",
        },
      },
      {
        heading: { en: "Change", ny: "Kusintha" },
        text: {
          en: "Next to the price you will see a change, like +2.5% or -1.0%. Green means the price rose today. Red means it fell.",
          ny: "Pambali pa mtengo umaona kusintha, monga +2.5% kapena -1.0%. Green amatanthauza mtengo wakwera lero. Red amatanthauza watsika.",
        },
      },
      {
        heading: { en: "Why prices move", ny: "Chifukwa mitengo imasintha" },
        text: {
          en: "If more people want to buy than sell, the price goes up. If more want to sell, it goes down. News, profits and the economy all change what people want.",
          ny: "Ngati anthu ambiri akufuna kugula kuposa kugulitsa, mtengo umakwera. Ngati ambiri akufuna kugulitsa, umatsika. Nkhani, phindu ndi chuma cha dziko zonse zimasintha zomwe anthu akufuna.",
        },
      },
      {
        text: {
          en: "One day's move means very little. What matters is where a company is going over months and years.",
          ny: "Kusintha kwa tsiku limodzi sikutanthauza zambiri. Chofunika ndi komwe kampani ikupita m'miyezi ndi zaka.",
        },
      },
    ],
  },
  {
    id: "market-indices",
    number: 4,
    title: { en: "Market Indices Explained", ny: "Ma Index a Msika" },
    minutes: 5,
    segments: [
      {
        text: {
          en: "An index is one number that sums up the whole market. Instead of checking sixteen prices, you check one.",
          ny: "Index ndi nambala imodzi yomwe imasonyeza msika wonse. M'malo moyang'ana mitengo khumi ndi isanu ndi umodzi, umayang'ana imodzi.",
        },
      },
      {
        heading: { en: "The MASI", ny: "MASI" },
        text: {
          en: "Malawi's main index is the Malawi All Share Index, the MASI. When you hear that the market rose, it usually means the MASI rose.",
          ny: "Index yaikulu ya Malawi ndi Malawi All Share Index, MASI. Ukamva kuti msika wakwera, nthawi zambiri amatanthauza kuti MASI yakwera.",
        },
      },
      {
        heading: { en: "How it is built", ny: "Momwe imapangidwira" },
        text: {
          en: "Bigger companies count for more. If NBM moves, the MASI moves more than if a small company moves the same amount.",
          ny: "Makampani akuluakulu amakhala ndi mphamvu zambiri. NBM ikasintha, MASI imasintha kwambiri kuposa kampani yaing'ono ikasintha mofanana.",
        },
      },
      {
        heading: { en: "Using it", ny: "Kuigwiritsa ntchito" },
        text: {
          en: "Compare your own stocks to the index. If your shares rose 5% while the MASI rose 10%, the market did better than you did.",
          ny: "Fananiza ma stock ako ndi index. Ngati ma shares ako akwera 5% pomwe MASI yakwera 10%, msika wachita bwino kuposa iwe.",
        },
      },
      {
        text: {
          en: "The index is a thermometer, not a crystal ball. It tells you how the market feels today, not where it goes tomorrow.",
          ny: "Index ndi chipimira kutentha, osati chowonera zam'tsogolo. Imakuuza momwe msika ulili lero, osati komwe upita mawa.",
        },
      },
    ],
  },
  {
    id: "buy-sell-hold",
    number: 5,
    title: { en: "Buy, Sell & Hold", ny: "Kugula, Kugulitsa ndi Kusunga" },
    minutes: 4,
    segments: [
      {
        heading: { en: "Buying", ny: "Kugula" },
        text: {
          en: "You buy when you believe a company will be worth more later. You need enough in your Pine wallet for the shares plus the broker's commission.",
          ny: "Umagula ukakhulupirira kuti kampani idzakhala ya mtengo wapatali m'tsogolo. Uyenera kukhala ndi ndalama zokwanira mu wallet yako ya Pine za ma shares ndi commission ya broker.",
        },
      },
      {
        heading: { en: "Selling", ny: "Kugulitsa" },
        text: {
          en: "You sell to turn shares back into kwacha. You might sell because you need the money, or because the reason you bought no longer holds.",
          ny: "Umagulitsa kuti ma shares abwerere kukhala kwacha. Ungagulitse chifukwa ukufuna ndalama, kapena chifukwa chomwe unagulira sichilipo.",
        },
      },
      {
        heading: { en: "Holding", ny: "Kusunga" },
        text: {
          en: "Holding means doing nothing, on purpose. Most of the money made in stocks comes from holding good companies for years, not from trading every week.",
          ny: "Kusunga kumatanthauza kusachita chilichonse, mwadala. Ndalama zambiri zomwe zimapezeka mu ma stock zimachokera pakusunga makampani abwino kwa zaka, osati kugula ndi kugulitsa sabata iliyonse.",
        },
      },
      {
        text: {
          en: "Every trade costs a commission. Trading often means paying often. Patience is free.",
          ny: "Trade iliyonse imalipiritsa commission. Kugula ndi kugulitsa pafupipafupi kumatanthauza kulipira pafupipafupi. Kuleza mtima ndi kwaulere.",
        },
      },
    ],
  },
  {
    id: "first-portfolio",
    number: 6,
    title: { en: "Building Your First Portfolio", ny: "Kupanga Portfolio Yako Yoyamba" },
    minutes: 6,
    segments: [
      {
        text: {
          en: "A portfolio is simply all the investments you own, seen together. Building a good one is about balance, not about picking one perfect stock.",
          ny: "Portfolio ndi ndalama zonse zomwe waika, zoonedwa pamodzi. Kupanga yabwino ndi za kulinganiza, osati kusankha stock imodzi yangwiro.",
        },
      },
      {
        heading: { en: "Do not put it all in one place", ny: "Usayike zonse pamalo amodzi" },
        text: {
          en: "If you own only one company and it has a bad year, you have a bad year. Own a few different companies, in different industries, so one problem cannot sink you.",
          ny: "Ngati uli ndi kampani imodzi yokha ndipo yakhala ndi chaka choipa, iwenso wakhala ndi chaka choipa. Khala ndi makampani angapo osiyana, m'mabizinesi osiyana, kuti vuto limodzi lisakumize.",
        },
      },
      {
        heading: { en: "Start small", ny: "Yamba pang'ono" },
        text: {
          en: "You do not need a fortune. Pine lets you start with a deposit from MK 1,000. Buy a few shares, watch how it feels, and add more as you learn.",
          ny: "Sufunika chuma chachikulu. Pine imakulola kuyamba ndi deposit kuyambira MK 1,000. Gula ma shares ochepa, ona momwe zimakhalira, ndipo uwonjezere pamene ukuphunzira.",
        },
      },
      {
        heading: { en: "Only invest what you can leave alone", ny: "Ika ndalama zomwe ungasiye" },
        text: {
          en: "Money for rent or school fees does not belong in stocks. Invest what you will not need for a year or more, so you are never forced to sell at a bad time.",
          ny: "Ndalama za lendi kapena sukulu fizi siziyenera kukhala mu ma stock. Ika zomwe sudzafuna kwa chaka chimodzi kapena kuposa, kuti usakakamizike kugulitsa pa nthawi yoipa.",
        },
      },
      {
        text: {
          en: "That is the course. You now know more than most people who have never invested. Open the Market tab and have a look around.",
          ny: "Ndiye maphunziro athu. Tsopano ukudziwa zambiri kuposa anthu ambiri omwe sanayikepo ndalama. Tsegula Market tab ndipo uyang'ane.",
        },
      },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
