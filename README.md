# CogniTest — Frontend

React + Vite + Tailwind ინტერფეისი. სამუშაოდ სჭირდება გაშვებული `cognitest-backend`.

## ლოკალურად

```bash
npm install
npm run dev
```

`npm run dev` გაუშვებს ფრონტს `http://localhost:5173`-ზე და `/api`-სა და `/ws`-ს გადაამისამართებს `http://localhost:4000`-ზე (იხ. `vite.config.ts`). ანუ ლოკალურად `.env` არ გჭირდება — მხოლოდ ბექენდი უნდა იყოს გაშვებული.

## პროდაქშენი

```bash
cp .env.example .env.production
# VITE_API_URL=https://შენი-ბექენდის-მისამართი
npm run build
```

`VITE_API_URL` ჩაიშენება build-ის დროს, ამიტომ მისი შეცვლის შემდეგ ხელახლა უნდა დააბილდო.

## დეპლოი (Vercel)

1. New Project → აირჩიე ეს რეპო
2. Framework: Vite · Build: `npm run build` · Output: `dist`
3. Environment Variables: `VITE_API_URL` = ბექენდის მისამართი (ბოლოს `/` გარეშე)
4. ბექენდზე `FRONTEND_URL`-ში ჩაწერე Vercel-ის მისამართი, თორემ CORS დაბლოკავს

Netlify-ზე იგივე პარამეტრებია.

## სტრუქტურა

```
src/
  lib/api.ts          — API კლიენტი: ტოკენი, WebSocket-ის მისამართი
  App.tsx             — ავტორიზაცია, როუტინგი, WebSocket
  components/
    AuthLoginModal        — შესვლა
    PasswordChangeModal   — პაროლის შეცვლა (სავალდებულო პირველ ჯერზე)
    Navbar
    StudentTeachingAgent  — AI ჩატი
    StudentExamCenter / ExamTakingScreen / CountdownTimer
    StudentDigests
    Admin*                — ტესტები, სილაბუსი, სტუდენტები, მონიტორინგი, დაიჯესტი
  context/LanguageContext — ka / en
  i18n.ts, utils/
```

## რამდენიმე მნიშვნელოვანი დეტალი

- **ტოკენი** ინახება `localStorage`-ში (`cognitest_token`). 401-ის შემთხვევაში ავტომატურად ხდება logout.
- **როლი სერვერიდან მოდის.** ინტერფეისში როლის გადამრთველი აღარ არის — რას ხედავ, ის შენი ანგარიშის როლზეა დამოკიდებული.
- **გამოცდის ტაიმერი სერვერისაა.** გვერდის განახლება დროს არ განაახლებს.
- **მონიტორინგის მოვლენებს ბრაუზერი მხოლოდ აგზავნის**; შეჯამებას სერვერი თვლის.

## მონიტორინგის რეალური შესაძლებლობები

ბრაუზერი ხედავს: ტაბის გადართვას, ფანჯრის დაკარგვას, copy/paste-ს, მარჯვენა ღილაკს, fullscreen-იდან გამოსვლას, კავშირის გაწყვეტას. ვერ ხედავს: მეორე მოწყობილობას, მეორე კომპიუტერს, სხვა ადამიანს გვერდით. ამიტომ ტექნიკური მონიტორინგი აუდიტორიაში ზედამხედველობის დამატებაა და არა ჩანაცვლება. iPhone-ზე fullscreen რეჟიმი არ მუშაობს — ამას ნუ დააფუძნებ წესებს.
