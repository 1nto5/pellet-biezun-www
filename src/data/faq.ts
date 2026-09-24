/**
 * Questions and answers: the FAQ page and its FAQPage JSON-LD. Answers are
 * plain text, because the JSON-LD needs them without markup.
 *
 * PRZYKŁAD: typical questions of pellet buyers, to be replaced with the ones
 * the client really hears on the phone.
 */
export const faq: { q: string; a: string }[] = [
  {
    q: "Jaki jest minimalny rozmiar zamówienia z dostawą?",
    a: "Dowozimy od jednej palety (975 kg). Pojedyncze worki można kupić na miejscu w składzie w Bieżuniu.",
  },
  {
    q: "Ile kosztuje dostawa?",
    a: "Zależy od miejscowości i ilości. W gminie Bieżuń dowozimy gratis, w pozostałych miejscowościach dostawa jest gratis od 2 lub 3 palet. Koszt dla konkretnej miejscowości jest na mapie dystrybucji.",
  },
  {
    q: "Jak szybko dostarczacie pellet?",
    a: "Zwykle w ciągu 2–5 dni roboczych od potwierdzenia zamówienia. W sezonie grzewczym termin może się wydłużyć, dlatego warto zamawiać wcześniej.",
  },
  {
    q: "Czy pellet ma certyfikat?",
    a: "Tak, sprzedajemy pellet klasy ENplus A1. Kartę parametrów pokażemy przy odbiorze albo wyślemy mailem.",
  },
  {
    q: "Jak płacę za zamówienie?",
    a: "Gotówką lub kartą przy odbiorze albo przelewem po otrzymaniu faktury. Strona nie pobiera płatności.",
  },
  {
    q: "Jak przechowywać pellet?",
    a: "W suchym, przewiewnym miejscu, z dala od ścian, które mogą być wilgotne. Worki najlepiej trzymać na palecie, nie na gołej posadzce.",
  },
];
