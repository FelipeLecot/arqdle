import { safeOrigin, type HtmlLang } from './html';

export type LegalPage = 'terms' | 'privacy';
export type LegalLang = HtmlLang;

/**
 * Legal copy changes rarely. The CDN caches /legal/* for 30 days; invalidate
 * that path after publishing new copy. Keep this value high so the pages stay
 * at the edge, not on the origin.
 */
export const LEGAL_CACHE_CONTROL = 'public, max-age=2592000';
/** Keep LABELS.*.updatedDate in sync when this date changes. */
export const LEGAL_LAST_UPDATED = '2026-11-19';

const LEGAL_PATHS: Record<LegalPage, Record<LegalLang, string>> = {
  terms: { es: '/legal/terms', en: '/legal/en/terms' },
  privacy: { es: '/legal/privacy', en: '/legal/en/privacy' },
};

export function legalPath(page: LegalPage, lang: LegalLang): string {
  return LEGAL_PATHS[page][lang];
}

export interface LegalRoute {
  path: string;
  page: LegalPage;
  lang: LegalLang;
}

export const LEGAL_ROUTES: readonly LegalRoute[] = [
  { path: legalPath('terms', 'es'), page: 'terms', lang: 'es' },
  { path: legalPath('terms', 'en'), page: 'terms', lang: 'en' },
  { path: legalPath('privacy', 'es'), page: 'privacy', lang: 'es' },
  { path: legalPath('privacy', 'en'), page: 'privacy', lang: 'en' },
];

const LABELS = {
  es: {
    eyebrow: 'Legal',
    terms: 'Términos del servicio',
    privacy: 'Política de privacidad',
    updatedLabel: 'Última actualización',
    updatedDate: '19 de noviembre de 2026',
    back: 'Volver al juego',
    nav: 'Páginas legales',
    otherLangLabel: 'English',
    footerTagline: 'Arqdle · Un juego diario de adivinanzas de arquitectura.',
    footerCredit: 'Desarrollado por',
  },
  en: {
    eyebrow: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    updatedLabel: 'Last updated',
    updatedDate: 'November 19, 2026',
    back: 'Back to the game',
    nav: 'Legal pages',
    otherLangLabel: 'Español',
    footerTagline: 'Arqdle · A daily architecture guessing game.',
    footerCredit: 'Developed by',
  },
} as const;

const TERMS_ES = `
    <h2>1. El servicio</h2>
    <p>Arqdle es un juego diario y gratuito de adivinanzas de arquitectura disponible en <a href="https://arqdle.com">arqdle.com</a>. Al usar el juego, aceptas estos términos. Si no estás de acuerdo, no uses el servicio.</p>

    <h2>2. Uso del juego</h2>
    <p>Puedes jugar por entretenimiento personal. No debes:</p>
    <ul>
      <li>infringir la ley ni los derechos de otras personas;</li>
      <li>atacar, sobrecargar, sondear o eludir la seguridad del servicio o de su infraestructura;</li>
      <li>extraer datos o automatizar solicitudes de forma que interrumpa el servicio o afecte a otros jugadores;</li>
      <li>hacerte pasar por otra persona o falsear tu cuenta.</li>
    </ul>

    <h2>3. Cuentas</h2>
    <p>Puedes jugar como invitado. El progreso de invitado se vincula a una cookie de sesión. Iniciar sesión con Google es opcional. Eres responsable de la actividad de tu cuenta. Puedes exportar o eliminar tu cuenta en cualquier momento desde el menú de cuenta.</p>

    <h2>4. Contenido y licencias</h2>
    <p>El código fuente de Arqdle se distribuye bajo la licencia GNU General Public License v3.0. El nombre y el logotipo de Arqdle no se conceden como marca. Los datos y las fotos de los edificios proceden de Wikipedia y Wikimedia Commons. Los créditos de las fotos aparecen en el panel de revelación. El contenido de terceros conserva su propia licencia.</p>

    <h2>5. Sin garantías</h2>
    <p>El servicio se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo. No garantizamos que el juego esté siempre disponible o libre de errores. La información de los edificios se recopila de fuentes públicas y puede contener errores.</p>

    <h2>6. Limitación de responsabilidad</h2>
    <p>En la medida máxima permitida por la ley, no somos responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, ni de la pérdida de datos o de beneficios derivados del uso del servicio. Nada en estos términos limita la responsabilidad que la ley no permita limitar.</p>

    <h2>7. Fin del acceso</h2>
    <p>Podemos suspender o terminar el acceso si incumples estos términos o si es necesario para proteger el servicio. Puedes dejar de usar el servicio en cualquier momento y eliminar tu cuenta.</p>

    <h2>8. Cambios</h2>
    <p>Podemos actualizar estos términos. La fecha al inicio indica la versión actual. Los cambios se aplican cuando se publican. Si sigues usando el servicio después de un cambio, aceptas los términos actualizados.</p>

    <h2>9. Legislación aplicable</h2>
    <p>Estos términos se rigen por las leyes de Uruguay. Las disputas se someten a los tribunales de Montevideo, Uruguay.</p>

    <h2>10. Contacto</h2>
    <p>¿Tienes preguntas sobre estos términos? Contacta con el desarrollador a través de <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>`;

const TERMS_EN = `
    <h2>1. The service</h2>
    <p>Arqdle is a free daily architecture guessing game available at <a href="https://arqdle.com">arqdle.com</a>. By using the game, you agree to these terms. If you do not agree, do not use the service.</p>

    <h2>2. Use of the game</h2>
    <p>You may play for personal entertainment. You must not:</p>
    <ul>
      <li>break the law or infringe the rights of others;</li>
      <li>attack, overload, probe, or bypass the security of the service or its infrastructure;</li>
      <li>scrape or automate requests in a way that disrupts the service or other players;</li>
      <li>impersonate another person or misrepresent your account.</li>
    </ul>

    <h2>3. Accounts</h2>
    <p>You can play as a guest. Guest progress is tied to a session cookie. Signing in with Google is optional. You are responsible for activity under your account. You can export or delete your account at any time from the account menu.</p>

    <h2>4. Content and licenses</h2>
    <p>The Arqdle source code is licensed under the GNU General Public License v3.0. The Arqdle name and logo are not granted as trademarks. Building facts and photos come from Wikipedia and Wikimedia Commons. Photo credits appear in the reveal panel. Third-party content remains under its own license.</p>

    <h2>5. No warranty</h2>
    <p>The service is provided “as is” and “as available”, without warranties of any kind. We do not guarantee that the game will always be available or free of errors. Building information is collected from public sources and may contain mistakes.</p>

    <h2>6. Limitation of liability</h2>
    <p>To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost data or profits, arising from your use of the service. Nothing in these terms limits liability that cannot be limited by law.</p>

    <h2>7. Ending access</h2>
    <p>We may suspend or end access if you violate these terms or if needed to protect the service. You may stop using the service at any time and delete your account.</p>

    <h2>8. Changes</h2>
    <p>We may update these terms. The date at the top shows the current version. Changes apply when they are published. If you continue to use the service after a change, you accept the updated terms.</p>

    <h2>9. Governing law</h2>
    <p>These terms are governed by the laws of Uruguay. Disputes are subject to the courts of Montevideo, Uruguay.</p>

    <h2>10. Contact</h2>
    <p>Questions about these terms? Contact the developer through <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>`;

const PRIVACY_ES = `
    <h2>1. Resumen</h2>
    <p>Arqdle es un juego pequeño y gratuito. No muestra anuncios y no usa analíticas de terceros ni cookies de seguimiento. Esta política explica qué datos se guardan y para qué.</p>

    <h2>2. Qué datos recopilamos</h2>
    <ul>
      <li><strong>Perfil de invitado.</strong> La primera vez que abres el juego, el servidor crea un perfil anónimo y una sesión aleatoria. No necesitas dar tu nombre ni tu correo electrónico.</li>
      <li><strong>Cookie de sesión.</strong> La cookie <code>arqdle_session</code> mantiene tu sesión. Es HttpOnly, SameSite=Lax y Secure en producción. Dura hasta 30 días. El servidor guarda solo un hash del token.</li>
      <li><strong>Datos de juego.</strong> Las partidas diarias y de práctica, los intentos, los resultados y las estadísticas se vinculan a tu perfil para que puedas continuar donde lo dejaste.</li>
      <li><strong>Cuenta de Google (opcional).</strong> Si inicias sesión con Google, recibimos tu identificador de Google, correo electrónico, nombre, URL de la foto de perfil e idioma. No recibimos ni guardamos tokens de acceso o de actualización de Google.</li>
      <li><strong>Datos técnicos.</strong> La limitación de solicitudes usa tu dirección IP o el ID de tu cuenta en memoria. La aplicación no guarda direcciones IP ni cadenas de agente de usuario en su base de datos. Los proveedores de alojamiento y CDN pueden procesar datos estándar de las solicitudes para entregar y proteger el servicio.</li>
    </ul>

    <h2>3. Para qué los usamos</h2>
    <p>Usamos estos datos para ejecutar el juego, guardar tu progreso y tus estadísticas, mantener tu cuenta disponible en varios dispositivos, prevenir abusos y generar informes agregados para el desarrollador. No vendemos datos personales.</p>

    <h2>4. Cookies y almacenamiento local</h2>
    <p>El sitio usa una cookie esencial para la sesión. No usa cookies de publicidad ni de analítica. Tu navegador también guarda tu elección de idioma, si ya viste la introducción y una marca de importación única en el almacenamiento local. Los datos de partidas antiguas del navegador pueden permanecer hasta que borres los datos del sitio. Esa información permanece en tu dispositivo.</p>

    <h2>5. Con quién compartimos datos</h2>
    <p>Solo compartimos datos con proveedores que ayudan a operar el servicio:</p>
    <ul>
      <li>AWS aloja la aplicación, la base de datos y la CDN.</li>
      <li>Google gestiona el inicio de sesión solo si decides usarlo.</li>
      <li>Wikimedia sirve las fotos de revelación. Cuando se carga una foto, tu navegador contacta con servidores de Wikimedia, que reciben datos estándar de la solicitud según sus propias políticas.</li>
    </ul>
    <p>No vendemos datos personales.</p>

    <h2>6. Conservación</h2>
    <p>Las sesiones caducan a los 30 días. Los perfiles de invitado vacíos con más de 90 días se eliminan. El historial de partidas y los datos de la cuenta se conservan hasta que elimines tu cuenta. Los informes agregados pueden conservarse más tiempo, pero no muestran correos electrónicos ni intentos individuales.</p>

    <h2>7. Tus opciones y derechos</h2>
    <p>Puedes descargar tus datos en JSON desde el menú de cuenta. Puedes eliminar tu cuenta y los datos relacionados desde el mismo menú. Según dónde vivas, también puedes tener derecho a acceder, corregir, exportar u oponerte al tratamiento de tus datos. Para hacer una solicitud, contacta con el desarrollador a través de <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>

    <h2>8. Menores</h2>
    <p>El servicio no está dirigido a menores de 13 años. No uses Arqdle si tienes menos de 13 años. Si crees que un menor ha proporcionado datos personales, contáctanos para eliminarlos.</p>

    <h2>9. Transferencias internacionales</h2>
    <p>El servicio se opera desde Uruguay y se aloja en Estados Unidos. Tus datos pueden procesarse en otros países donde operan nuestros proveedores. Tomamos medidas razonables para protegerlos.</p>

    <h2>10. Cambios y contacto</h2>
    <p>Podemos actualizar esta política. La fecha al inicio indica la versión actual. ¿Tienes preguntas sobre privacidad? Contacta con el desarrollador a través de <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>`;

const PRIVACY_EN = `
    <h2>1. Overview</h2>
    <p>Arqdle is a small, free game. It does not show ads and does not use third-party analytics or tracking cookies. This policy explains what is stored and why.</p>

    <h2>2. What we collect</h2>
    <ul>
      <li><strong>Guest profile.</strong> When you first open the game, the server creates an anonymous profile and a random session. You do not need to give a name or email address.</li>
      <li><strong>Session cookie.</strong> The <code>arqdle_session</code> cookie keeps you signed in. It is HttpOnly, SameSite=Lax, and Secure in production. It lasts up to 30 days. The server stores only a hash of the token.</li>
      <li><strong>Game data.</strong> Daily and practice games, guesses, results, and stats are linked to your profile so you can continue where you left off.</li>
      <li><strong>Google account (optional).</strong> If you sign in with Google, we receive your Google subject identifier, email address, name, profile picture URL, and locale. We do not receive or store Google access or refresh tokens.</li>
      <li><strong>Technical data.</strong> Rate limiting uses your IP address or account ID in memory. The app does not write IP addresses or user-agent strings to its database. Hosting and CDN providers may process standard request data to deliver and protect the service.</li>
    </ul>

    <h2>3. How we use it</h2>
    <p>We use this data to run the game, save your progress and stats, keep your account available across devices, prevent abuse, and produce aggregate reports for the developer. We do not sell personal data.</p>

    <h2>4. Cookies and local storage</h2>
    <p>The site uses one essential cookie for the session. It does not use advertising or analytics cookies. Your browser also stores your language choice, whether you have seen the intro, and a one-time import marker in local storage. Old browser-only game data may remain until you clear site data. That information stays on your device.</p>

    <h2>5. Sharing</h2>
    <p>We share data only with providers that help run the service:</p>
    <ul>
      <li>AWS hosts the application, database, and CDN.</li>
      <li>Google handles sign-in only if you choose to use it.</li>
      <li>Wikimedia serves reveal photos. When a photo loads, your browser contacts Wikimedia servers, which receive standard request data under their own policies.</li>
    </ul>
    <p>We do not sell personal data.</p>

    <h2>6. Retention</h2>
    <p>Sessions expire after 30 days. Empty guest profiles older than 90 days are deleted. Game history and account data are kept until you delete your account. Aggregate reports may be kept longer, but they do not expose emails or individual guesses.</p>

    <h2>7. Your choices and rights</h2>
    <p>You can download your data as JSON from the account menu. You can delete your account and related data from the same menu. Depending on where you live, you may also have the right to access, correct, export, or object to the processing of your data. To make a request, contact the developer through <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>

    <h2>8. Children</h2>
    <p>The service is not directed to children under 13. Do not use Arqdle if you are under 13. If you believe a child has provided personal data, contact us so we can remove it.</p>

    <h2>9. International transfers</h2>
    <p>The service is operated from Uruguay and hosted in the United States. Your data may be processed in other countries where our providers operate. We take reasonable steps to protect it.</p>

    <h2>10. Changes and contact</h2>
    <p>We may update this policy. The date at the top shows the current version. Questions about privacy? Contact the developer through <a href="https://www.felipelecot.com" rel="noreferrer">felipelecot.com</a>.</p>`;

const PAGE_META: Record<
  LegalPage,
  Record<LegalLang, { heading: string; description: string; body: string }>
> = {
  terms: {
    es: {
      heading: 'Términos del servicio',
      description:
        'Los términos que se aplican al usar Arqdle, un juego diario y gratuito de adivinanzas de arquitectura.',
      body: TERMS_ES,
    },
    en: {
      heading: 'Terms of Service',
      description:
        'The terms that apply when you use Arqdle, a free daily architecture guessing game.',
      body: TERMS_EN,
    },
  },
  privacy: {
    es: {
      heading: 'Política de privacidad',
      description:
        'Qué datos guarda Arqdle, para qué los usa y cómo puedes exportarlos o eliminarlos.',
      body: PRIVACY_ES,
    },
    en: {
      heading: 'Privacy Policy',
      description:
        'What Arqdle stores, why it stores it, and how to export or delete your data.',
      body: PRIVACY_EN,
    },
  },
};

const STYLES = `
      :root {
        --bg: #ffffff;
        --ink: #171717;
        --body: #2c2a26;
        --muted: #6d685f;
        --line: #e3e0da;
        --font: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Helvetica, Arial, sans-serif;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      html {
        -webkit-text-size-adjust: 100%;
        background: var(--bg);
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: var(--font);
        font-size: 15px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 3px;
        text-decoration-thickness: 1px;
      }
      a:hover {
        text-decoration-thickness: 2px;
      }
      :focus-visible {
        outline: 2px solid var(--ink);
        outline-offset: 2px;
      }
      .site-header {
        max-width: 760px;
        margin: 0 auto;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--line);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--ink);
        text-decoration: none;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .brand svg {
        display: block;
      }
      .site-nav {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 16px;
        font-size: 11px;
        font-weight: 600;
      }
      .site-nav a {
        color: var(--muted);
        text-decoration: none;
      }
      .site-nav a:hover,
      .site-nav a[aria-current='page'] {
        color: var(--ink);
        text-decoration: underline;
      }
      .site-nav .lang {
        padding-left: 14px;
        border-left: 1px solid var(--line);
      }
      .page {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 24px 64px;
      }
      .eyebrow {
        margin: 0 0 10px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(34px, 6vw, 52px);
        font-weight: 800;
        letter-spacing: -0.045em;
        line-height: 1.02;
      }
      .updated {
        margin: 12px 0 34px;
        color: var(--muted);
        font-size: 12px;
      }
      h2 {
        margin: 32px 0 8px;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.015em;
      }
      p,
      li {
        color: var(--body);
      }
      p {
        margin: 0 0 12px;
      }
      ul {
        margin: 0 0 14px;
        padding-left: 20px;
      }
      li {
        margin: 5px 0;
      }
      code {
        padding: 1px 5px;
        border-radius: 3px;
        background: #f2f0ec;
        font-size: 0.92em;
      }
      hr {
        margin: 38px 0 22px;
        border: 0;
        border-top: 1px solid var(--line);
      }
      .back {
        font-size: 13px;
      }
      .site-footer {
        max-width: 760px;
        margin: 0 auto;
        padding: 22px 24px 38px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 10px;
        text-align: center;
      }
      .site-footer p {
        margin: 4px 0;
        color: inherit;
      }
      .site-footer a {
        color: var(--ink);
      }
      @media (max-width: 520px) {
        .site-header {
          align-items: flex-start;
          flex-direction: column;
        }
        .site-nav {
          width: 100%;
        }
        .page {
          padding-top: 36px;
        }
      }`;

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function renderLegalPage(page: LegalPage, lang: LegalLang, origin: string): string {
  const safe = safeOrigin(origin);
  const meta = PAGE_META[page][lang];
  const labels = LABELS[lang];
  const otherLang: LegalLang = lang === 'en' ? 'es' : 'en';
  const homeQuery = lang === 'en' ? '/?lang=en' : '/';
  const home = `${safe}${homeQuery}`;
  const canonical = `${safe}${legalPath(page, lang)}`;
  const otherLangPath = `${safe}${legalPath(page, otherLang)}`;
  const termsPath = `${safe}${legalPath('terms', lang)}`;
  const privacyPath = `${safe}${legalPath('privacy', lang)}`;
  const alternateEs = `${safe}${legalPath(page, 'es')}`;
  const alternateEn = `${safe}${legalPath(page, 'en')}`;
  const title = `Arqdle — ${meta.heading}`;

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="color-scheme" content="light" />
    <meta name="robots" content="index, follow" />
    <meta name="description" content="${escapeAttribute(meta.description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="es" href="${alternateEs}" />
    <link rel="alternate" hreflang="en" href="${alternateEn}" />
    <link rel="alternate" hreflang="x-default" href="${alternateEs}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
    <title>${escapeAttribute(title)}</title>
    <style>${STYLES}
    </style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${home}" aria-label="Arqdle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 20V11a8 8 0 0 1 16 0v9" />
          <path d="M9 20v-7a3 3 0 0 1 6 0v7" />
          <path d="M2 20h20" />
        </svg>
        <span>ARQDLE</span>
      </a>
      <nav class="site-nav" aria-label="${labels.nav}">
        <a href="${termsPath}"${page === 'terms' ? ' aria-current="page"' : ''}>${labels.terms}</a>
        <a href="${privacyPath}"${page === 'privacy' ? ' aria-current="page"' : ''}>${labels.privacy}</a>
        <a class="lang" href="${otherLangPath}" hreflang="${otherLang}" lang="${otherLang}">${labels.otherLangLabel}</a>
      </nav>
    </header>

    <main class="page">
      <p class="eyebrow">${labels.eyebrow}</p>
      <h1>${meta.heading}</h1>
      <p class="updated">${labels.updatedLabel}: <time datetime="${LEGAL_LAST_UPDATED}">${labels.updatedDate}</time></p>
      ${meta.body}
      <hr />
      <p class="back"><a href="${home}">← ${labels.back}</a></p>
    </main>

    <footer class="site-footer">
      <p>${labels.footerTagline}</p>
      <p>${labels.footerCredit} <a href="https://www.felipelecot.com" rel="noreferrer">Felipe Lecot</a>.</p>
    </footer>
  </body>
</html>
`;
}
