/**
 * Seed-скрипт: заповнює БД тестовими даними.
 *
 *   npm run db:seed              # додає дані (НЕ очищає існуючі)
 *   npm run db:seed -- --reset   # очищає таблиці та засіває заново
 *
 * Пароль для всіх юзерів: password123
 */
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@/config/env';
import { hashPassword } from '@/lib/password';
import * as schema from './schema';
import {
  users,
  events,
  registrations,
  comments,
  tags,
  eventTags,
  type NewUser,
  type NewEvent,
} from './schema';

const reset = process.argv.includes('--reset');

// ─── Утиліти ───────────────────────────────────────────────────────────────

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

function daysFromNow(days: number, hour = 18, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Дані ──────────────────────────────────────────────────────────────────

const CITIES = [
  { name: 'Київ',             lat: 50.4501, lng: 30.5234 },
  { name: 'Львів',            lat: 49.8397, lng: 24.0297 },
  { name: 'Харків',           lat: 49.9935, lng: 36.2304 },
  { name: 'Одеса',            lat: 46.4825, lng: 30.7233 },
  { name: 'Дніпро',           lat: 48.4647, lng: 35.0462 },
  { name: 'Вінниця',          lat: 49.2331, lng: 28.4682 },
  { name: 'Чернівці',         lat: 48.2917, lng: 25.9352 },
  { name: 'Івано-Франківськ', lat: 48.9215, lng: 24.7097 },
  { name: 'Тернопіль',        lat: 49.5535, lng: 25.5948 },
  { name: 'Запоріжжя',        lat: 47.8388, lng: 35.1396 },
  { name: 'Полтава',          lat: 49.5883, lng: 34.5514 },
  { name: 'Черкаси',          lat: 49.4444, lng: 32.0598 },
  { name: 'Житомир',          lat: 50.2547, lng: 28.6587 },
  { name: 'Хмельницький',     lat: 49.4229, lng: 26.9871 },
  { name: 'Луцьк',            lat: 50.7472, lng: 25.3254 },
  { name: 'Ужгород',          lat: 48.6208, lng: 22.2879 },
] as const;

const TAGS_POOL = [
  'музика',     'благодійність', 'родина',       'безкоштовно',
  'просто-неба','для-дітей',     'освіта',       'збір-зсу',
  'мистецтво',  'українське',    'тренування',   'екологія',
  'спорт',      'кіно',          'література',   'інклюзивність',
  'тренінг',    'нетворкінг',    'волонтерство', 'культура',
];

// Шаблони заходів за категоріями (без прив'язки до конкретного міста —
// місто обирається випадково з CITIES і підставляється у locationName)
const TEMPLATES = {
  concert: [
    {
      title: 'Концерт "Океан Ельзи"',
      description: 'Великий концерт легендарного гурту до 30-річчя творчого шляху. Виконуватимуться як класичні хіти, так і нові пісні з останнього альбому.',
    },
    {
      title: 'KAZKA: Тур "Дім"',
      description: 'Сольний концерт KAZKA у рамках всеукраїнського туру "Дім". На сцені — нові аранжування улюблених хітів.',
    },
    {
      title: 'Тіна Кароль: Найбільший концерт року',
      description: 'Великий сольний концерт у супроводі симфонічного оркестру. Програма включає хіти останніх 20 років.',
    },
    {
      title: 'ONUKA з оркестром: Електро-симфонія',
      description: 'Унікальне поєднання електронної музики та живого оркестру. Один з найочікуваніших концертів сезону.',
    },
    {
      title: 'Антитіла: Незалежність',
      description: 'Концерт-маніфест на підтримку Збройних Сил України. Усі виручені кошти буде передано на потреби ЗСУ.',
    },
    {
      title: 'Джаз-вечір у філармонії',
      description: 'Камерний джазовий концерт за участі провідних музикантів країни. У програмі — класика jazz standards та авторські композиції.',
    },
    {
      title: 'Симфонічний вечір "Музика України"',
      description: 'Великий вечір української симфонічної музики XX–XXI століть. Прозвучать твори Скорика, Сильвестрова, Грабовського.',
    },
  ],
  volunteering: [
    {
      title: 'Прибирання міського парку',
      description: 'Збираємось разом, щоб привести в порядок улюблений куточок міста. Усі необхідні інструменти будуть надані. Беремо хороший настрій та зручний одяг.',
    },
    {
      title: 'Збір допомоги для ЗСУ',
      description: 'Збираємо медикаменти, теплі речі та продукти тривалого зберігання для воїнів на передовій. Приймається будь-яка допомога.',
    },
    {
      title: 'Допомога безпритульним тваринам',
      description: 'Поїздка до притулку: годуємо, прибираємо, вигулюємо собак. Бонус — обнімашки з пухнастиками!',
    },
    {
      title: 'Плетіння маскувальних сіток',
      description: 'Майстер-клас та одночасне виготовлення сіток для фронту. Усі матеріали надаємо.',
    },
    {
      title: 'Здача крові: акція "Кожна крапля рятує"',
      description: 'Виїзний пункт здачі донорської крові у партнерстві з обласним центром крові. Реєстрація обовʼязкова.',
    },
    {
      title: 'Підготовка наборів для шкіл переселенців',
      description: 'Збираємо канцелярію та шкільне приладдя для дітей з прифронтових територій. Підготуємо набори разом.',
    },
    {
      title: 'Озеленення прибудинкової території',
      description: 'Висаджуємо дерева та кущі у новому скверику. Приходьте з рукавицями та хорошим настроєм!',
    },
  ],
  rally: [
    {
      title: 'Мітинг на підтримку політичних в\'язнів',
      description: 'Зібрання з вимогою звільнення українських політв\'язнів та військовополонених. Беремо плакати та портрети.',
    },
    {
      title: 'Хода пам\'яті жертв Голодомору',
      description: 'Урочиста хода до меморіалу. Запалюємо свічки пам\'яті о 16:00.',
    },
    {
      title: 'Мітинг проти забудови історичного центру',
      description: 'Зібрання громади на захист пам\'яток архітектури. Виступи активістів та архітекторів.',
    },
    {
      title: 'Акція "Не мовчи" — за права жінок',
      description: 'Мирна акція до Міжнародного дня боротьби з насильством щодо жінок. Хода зі свічками та виступи постраждалих.',
    },
  ],
  festival: [
    {
      title: 'Музичний фестиваль "Свобода"',
      description: 'Масштабний музичний фестиваль на 5 сценах. Понад 50 артистів з України та світу. Кемпінг, фуд-корт, простори для відпочинку.',
    },
    {
      title: 'Фестиваль українського духу',
      description: 'Триденний фестиваль української рок-музики, тренінгів та лекцій. Атмосфера патріотизму та свободи.',
    },
    {
      title: 'Етно-фест "Коріння"',
      description: 'Музичний фестиваль просто-неба з акцентом на українську автентику. Концерти, ремісничі майстерні, етно-зона.',
    },
    {
      title: 'Книжковий ярмарок',
      description: 'Подія книжкової культури. Презентації новинок, дискусії з письменниками, дитячі програми.',
    },
    {
      title: 'Фестиваль сучасного мистецтва',
      description: 'Мультидисциплінарний фестиваль: театр, музика, кіно, перформанси. Інтерактивні інсталяції.',
    },
    {
      title: 'Фестиваль кави',
      description: 'Дегустації від найкращих ростерів країни, лекції від чемпіонів бариста, конкурси та шоу.',
    },
    {
      title: 'Фестиваль шоколаду',
      description: 'Триденний фестиваль присвячений солодощам. Шоколадні шоу, майстер-класи, дегустації.',
    },
  ],
  workshop: [
    {
      title: 'Воркшоп: основи Frontend розробки',
      description: 'Інтенсивний 4-годинний воркшоп з HTML, CSS та JavaScript для початківців. Усі практикуються на реальних задачах.',
    },
    {
      title: 'Майстер-клас з ілюстрації аквареллю',
      description: 'Створимо власну картину з нуля під керівництвом професійного художника. Матеріали входять у вартість.',
    },
    {
      title: 'Тренінг "Перша медична допомога"',
      description: 'Базовий курс тактичної медицини. Інструктори з військовим досвідом. Сертифікати після проходження.',
    },
    {
      title: 'Кулінарний воркшоп: італійська паста',
      description: 'Готуємо 4 види пасти з нуля разом з шеф-кухарем. Вечеря з вашими стравами та келих вина у подарунок.',
    },
    {
      title: 'Лекція: фінансова грамотність для всіх',
      description: 'Основи особистих фінансів, інвестицій та планування бюджету. Багато прикладів та реальних кейсів.',
    },
    {
      title: 'Воркшоп з керамики: робота на гончарному крузі',
      description: 'Кожен учасник створює власний виріб та забирає додому. 3 години практики під керівництвом майстра.',
    },
    {
      title: 'Курс публічних виступів',
      description: 'Одноденний інтенсив: робота з голосом, структура виступу, контакт з аудиторією. Багато практики.',
    },
    {
      title: 'Майстер-клас "Українська вишиванка"',
      description: 'Вчимося вишивати традиційні українські візерунки. Створимо власну картину-оберіг.',
    },
  ],
} as const;

// Заходи прив'язані до конкретних місць у Києві
const KYIV_EVENTS = [
  {
    title: 'Прибирання Маріїнського парку',
    description: 'Команда волонтерів збирається для прибирання одного з найкрасивіших парків Києва. Інструменти та рукавиці надамо. Після прибирання — чаювання разом.',
    category: 'volunteering' as const,
    locationName: 'Маріїнський парк, Київ',
    latitude: '50.448600',
    longitude: '30.537500',
  },
  {
    title: 'Концерт у Палаці Україна',
    description: 'Великий сольний концерт у головному концертному залі країни. Симфонічний оркестр, понад 2000 місць, відмінна акустика.',
    category: 'concert' as const,
    locationName: 'Палац Україна, Київ',
    latitude: '50.420900',
    longitude: '30.521500',
  },
  {
    title: 'Atlas Weekend 2026 — головний фестиваль літа',
    description: 'Найбільший музичний фестиваль України на ВДНГ. 5 сцен, понад 100 артистів, кемпінг, фуд-корт. Триває 5 днів.',
    category: 'festival' as const,
    locationName: 'ВДНГ, Київ',
    latitude: '50.389300',
    longitude: '30.464700',
  },
  {
    title: 'Хода Єдності з Майдану',
    description: 'Урочиста хода від Майдану Незалежності до Софійської площі. Виступи, музика, фотозона з символікою.',
    category: 'rally' as const,
    locationName: 'Майдан Незалежності, Київ',
    latitude: '50.450100',
    longitude: '30.524000',
  },
  {
    title: 'Воркшоп з React у IT-Hub',
    description: 'Інтенсив з React 18 та TanStack Query. 6 годин практики, реальний проєкт від нуля до деплою. Сертифікат після проходження.',
    category: 'workshop' as const,
    locationName: 'Креативний простір "Часопис", Київ',
    latitude: '50.450000',
    longitude: '30.510000',
  },
  {
    title: 'Концерт класики у Парку Шевченка',
    description: 'Безкоштовний концерт камерного оркестру просто-неба. Шопен, Лисенко, Сильвестров. Беремо плед та гарний настрій.',
    category: 'concert' as const,
    locationName: 'Парк Шевченка, Київ',
    latitude: '50.441900',
    longitude: '30.508900',
  },
  {
    title: 'Книжковий ярмарок на Контрактовій',
    description: 'Триденний книжковий ярмарок під відкритим небом. Презентації, автограф-сесії, дитячі майстерні. Понад 50 видавництв.',
    category: 'festival' as const,
    locationName: 'Контрактова площа, Київ',
    latitude: '50.466900',
    longitude: '30.515500',
  },
];

const ORGANIZERS = [
  { name: 'Анна Шевченко',   email: 'anna.shevchenko@zbir.ua' },
  { name: 'Микола Петренко', email: 'mykola.petrenko@zbir.ua' },
  { name: 'Олена Іваненко',  email: 'olena.ivanenko@zbir.ua' },
  { name: 'Тарас Гриценко',  email: 'taras.grytsenko@zbir.ua' },
  { name: 'Ірина Бондар',    email: 'iryna.bondar@zbir.ua' },
];

const PARTICIPANTS = [
  { name: 'Олег Коваленко',  email: 'oleh.kovalenko@example.com' },
  { name: 'Марія Лисенко',   email: 'maria.lysenko@example.com' },
  { name: 'Андрій Дяченко',  email: 'andriy.dyachenko@example.com' },
  { name: 'Софія Мельник',   email: 'sofiya.melnyk@example.com' },
  { name: 'Дмитро Кравець',  email: 'dmytro.kravets@example.com' },
  { name: 'Наталія Гончар',  email: 'nataliya.honchar@example.com' },
  { name: 'Юрій Білий',      email: 'yuriy.bilyi@example.com' },
  { name: 'Тетяна Поліщук',  email: 'tetyana.polishchuk@example.com' },
  { name: 'Віктор Зінченко', email: 'viktor.zinchenko@example.com' },
  { name: 'Катерина Руденко',email: 'kateryna.rudenko@example.com' },
];

const COMMENTS = [
  { text: 'Чудовий захід! Все було організовано на високому рівні.', rating: 5 },
  { text: 'Дуже сподобалось, рекомендую друзям!', rating: 5 },
  { text: 'Гарна атмосфера, доброзичливі організатори. Прийду ще.', rating: 5 },
  { text: 'Все на найвищому рівні. Дякую за чудовий день!', rating: 5 },
  { text: 'Непогано, але можна було краще організувати реєстрацію.', rating: 4 },
  { text: 'Корисно та цікаво. Дізнався багато нового.', rating: 4 },
  { text: 'Захід вартий уваги, рекомендую.', rating: 4 },
  { text: 'Середньо. Очікував більшого від програми.', rating: 3 },
  { text: 'Як для першого разу — нормально.', rating: 3 },
];

// ─── Логіка ────────────────────────────────────────────────────────────────

async function main() {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
  const db = drizzle(pool, { schema });

  console.log(`▶  Seeding (reset=${reset})...`);

  if (reset) {
    console.log('   - очищення таблиць');
    // Порядок важливий: спочатку залежні
    await db.delete(comments);
    await db.delete(registrations);
    await db.delete(eventTags);
    await db.delete(events);
    await db.delete(tags);
    // users залишаємо, видаляємо тільки тестових
    for (const u of [...ORGANIZERS, ...PARTICIPANTS]) {
      await db.delete(users).where(eq(users.email, u.email));
    }
  }

  // 1. Користувачі
  console.log('   - користувачі');
  const passwordHash = await hashPassword('password123');

  const organizerRows: NewUser[] = ORGANIZERS.map((u) => ({
    email: u.email,
    name: u.name,
    role: 'organizer' as const,
    passwordHash,
  }));
  const participantRows: NewUser[] = PARTICIPANTS.map((u) => ({
    email: u.email,
    name: u.name,
    role: 'participant' as const,
    passwordHash,
  }));

  await db.insert(users).values([...organizerRows, ...participantRows]).onConflictDoNothing();

  const allUsers = await db.select().from(users);
  const organizers = allUsers.filter((u) => u.role === 'organizer');
  const participants = allUsers.filter((u) => u.role === 'participant');
  console.log(`     organizers=${organizers.length}, participants=${participants.length}`);

  // 2. Теги
  console.log('   - теги');
  const existingTagNames = (await db.select().from(tags)).map((t) => t.name);
  const newTags = TAGS_POOL.filter((t) => !existingTagNames.includes(t)).map((name) => ({ name }));
  if (newTags.length > 0) await db.insert(tags).values(newTags);
  const allTags = await db.select().from(tags);

  // 3. Заходи
  console.log('   - заходи');
  const eventInserts: NewEvent[] = [];
  const categoryKeys = Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>;

  for (const category of categoryKeys) {
    const templates = TEMPLATES[category];
    for (const tpl of templates) {
      const city = pickRandom(CITIES);
      // jitter координат у радіусі ~5 км
      const lat = (city.lat + (Math.random() - 0.5) * 0.08).toFixed(6);
      const lng = (city.lng + (Math.random() - 0.5) * 0.08).toFixed(6);

      // 75% майбутні (1-90 днів), 20% сьогодні-завтра, 5% минулі
      const r = Math.random();
      let daysOffset: number;
      if (r < 0.05) daysOffset = -Math.floor(Math.random() * 30) - 1;
      else if (r < 0.25) daysOffset = Math.floor(Math.random() * 2);
      else daysOffset = Math.floor(Math.random() * 90) + 2;

      const startsAt = daysFromNow(
        daysOffset,
        Math.floor(Math.random() * 12) + 10, // 10:00 - 22:00
        pickRandom([0, 15, 30, 45]),
      );
      const endsAt = new Date(startsAt);
      endsAt.setHours(endsAt.getHours() + 2 + Math.floor(Math.random() * 4));

      const organizer = pickRandom(organizers);
      const capacity = pickRandom([null, 50, 100, 200, 500, 1000]);
      // 85% published, 10% draft, 5% cancelled
      const statusRoll = Math.random();
      const status: 'published' | 'draft' | 'cancelled' =
        statusRoll < 0.85 ? 'published' : statusRoll < 0.95 ? 'draft' : 'cancelled';

      eventInserts.push({
        title: tpl.title,
        description: tpl.description,
        startsAt,
        endsAt,
        locationName: `${city.name}`,
        latitude: lat,
        longitude: lng,
        category,
        capacity,
        organizerId: organizer!.id,
        status,
      });
    }
  }

  // Київські заходи — реальні локації
  for (const kyiv of KYIV_EVENTS) {
    const daysOffset = Math.floor(Math.random() * 60) + 3;
    const startsAt = daysFromNow(daysOffset, 18 + Math.floor(Math.random() * 4) - 2);
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 2 + Math.floor(Math.random() * 4));

    eventInserts.push({
      title: kyiv.title,
      description: kyiv.description,
      startsAt,
      endsAt,
      locationName: kyiv.locationName,
      latitude: kyiv.latitude,
      longitude: kyiv.longitude,
      category: kyiv.category,
      capacity: pickRandom([null, 100, 200, 500, 1000, 2000]),
      organizerId: pickRandom(organizers)!.id,
      status: 'published' as const,
    });
  }

  const createdEvents = await db.insert(events).values(eventInserts).returning();
  console.log(`     ${createdEvents.length} заходів (з них ${KYIV_EVENTS.length} у Києві)`);

  // 4. Зв'язки event_tags (2-5 тегів на захід)
  console.log('   - теги до заходів');
  const eventTagInserts = createdEvents.flatMap((event) => {
    const count = 2 + Math.floor(Math.random() * 4);
    return pickN(allTags, count).map((tag) => ({ eventId: event.id, tagId: tag.id }));
  });
  await db.insert(eventTags).values(eventTagInserts).onConflictDoNothing();

  // 5. Реєстрації (4-12 учасників на published захід)
  console.log('   - реєстрації');
  const regInserts: Array<{ userId: string; eventId: string; status: 'registered' }> = [];
  for (const event of createdEvents) {
    if (event.status !== 'published') continue;
    const n = 4 + Math.floor(Math.random() * 9);
    const regs = pickN(participants, Math.min(n, participants.length));
    for (const p of regs) {
      regInserts.push({ userId: p.id, eventId: event.id, status: 'registered' });
    }
  }
  if (regInserts.length > 0) {
    await db.insert(registrations).values(regInserts).onConflictDoNothing();
  }

  // 6. Коментарі (1-4 на захід, переважно з рейтингом)
  console.log('   - коментарі');
  const commentInserts: Array<{
    eventId: string;
    userId: string;
    text: string;
    rating: number | null;
  }> = [];
  for (const event of createdEvents) {
    if (event.status !== 'published') continue;
    const n = Math.floor(Math.random() * 4) + 1;
    const commenters = pickN(participants, Math.min(n, participants.length));
    for (const commenter of commenters) {
      const c = pickRandom(COMMENTS);
      commentInserts.push({
        eventId: event.id,
        userId: commenter.id,
        text: c.text,
        rating: Math.random() < 0.8 ? c.rating : null,
      });
    }
  }
  if (commentInserts.length > 0) {
    await db.insert(comments).values(commentInserts);
  }

  console.log('\n✓  Done!');
  console.log('\nТестові акаунти:');
  console.log('  Організатор: anna.shevchenko@zbir.ua / password123');
  console.log('  Учасник:     oleh.kovalenko@example.com / password123');

  await pool.end();
}

main().catch((err) => {
  console.error('✗  Seed failed:', err);
  process.exit(1);
});
