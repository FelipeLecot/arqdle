import { buildingExtraEs } from './esExtra';
import { buildingIconsEs } from './esIcons';
import {
  buildingProposalEs,
  countriesEsExtra,
  materialsEsExtra,
  stylesEsExtra,
  typesEsExtra,
} from './esProposal';

export interface BuildingCopyEs {
  name: string;
  city: string;
  blurb: string;
  fact: string;
  yearNote?: string;
  aliases?: string[];
}

export const countriesEs: Record<string, string> = {
  Italy: 'Italia',
  France: 'Francia',
  Germany: 'Alemania',
  Spain: 'España',
  'Vatican City': 'Ciudad del Vaticano',
  'United Kingdom': 'Reino Unido',
  Greece: 'Grecia',
  Türkiye: 'Turquía',
  Russia: 'Rusia',
  'United States': 'Estados Unidos',
  Canada: 'Canadá',
  Mexico: 'México',
  Peru: 'Perú',
  Brazil: 'Brasil',
  Egypt: 'Egipto',
  Zimbabwe: 'Zimbabue',
  Morocco: 'Marruecos',
  Ethiopia: 'Etiopía',
  India: 'India',
  China: 'China',
  Cambodia: 'Camboya',
  Indonesia: 'Indonesia',
  Japan: 'Japón',
  Malaysia: 'Malasia',
  'United Arab Emirates': 'Emiratos Árabes Unidos',
  Taiwan: 'Taiwán',
  Azerbaijan: 'Azerbaiyán',
  Jordan: 'Jordania',
  Australia: 'Australia',
  'New Zealand': 'Nueva Zelanda',
  Antarctica: 'Antártida',
  Ireland: 'Irlanda',
  Czechia: 'Chequia',
  Hungary: 'Hungría',
  Poland: 'Polonia',
  Croatia: 'Croacia',
  Belgium: 'Bélgica',
  Netherlands: 'Países Bajos',
  Norway: 'Noruega',
  Sweden: 'Suecia',
  Finland: 'Finlandia',
  Switzerland: 'Suiza',
  Portugal: 'Portugal',
  Austria: 'Austria',
  Guatemala: 'Guatemala',
  Cuba: 'Cuba',
  Ecuador: 'Ecuador',
  Colombia: 'Colombia',
  Argentina: 'Argentina',
  Uruguay: 'Uruguay',
  Chile: 'Chile',
  Bolivia: 'Bolivia',
  Paraguay: 'Paraguay',
  Tunisia: 'Túnez',
  Mali: 'Malí',
  Tanzania: 'Tanzania',
  Sudan: 'Sudán',
  'South Africa': 'Sudáfrica',
  'Ivory Coast': 'Costa de Marfil',
  Nigeria: 'Nigeria',
  Rwanda: 'Ruanda',
  Iran: 'Irán',
  Iraq: 'Irak',
  Syria: 'Siria',
  Qatar: 'Catar',
  'Saudi Arabia': 'Arabia Saudita',
  Pakistan: 'Pakistán',
  Bangladesh: 'Bangladés',
  'Sri Lanka': 'Sri Lanka',
  Nepal: 'Nepal',
  Myanmar: 'Myanmar',
  Thailand: 'Tailandia',
  Laos: 'Laos',
  Vietnam: 'Vietnam',
  Philippines: 'Filipinas',
  'South Korea': 'Corea del Sur',
  Singapore: 'Singapur',
  Micronesia: 'Micronesia',
  'New Caledonia': 'Nueva Caledonia',
  Iceland: 'Islandia',
  Denmark: 'Dinamarca',
  Ukraine: 'Ucrania',
  Romania: 'Rumanía',
  Uzbekistan: 'Uzbekistán',
  Yemen: 'Yemen',
  Lebanon: 'Líbano',
  Panama: 'Panamá',
  Ghana: 'Ghana',
  Senegal: 'Senegal',
  Israel: 'Israel',
  Tonga: 'Tonga',
  Bhutan: 'Bután',
  ...countriesEsExtra,
};

export const continentsEs: Record<string, string> = {
  Europe: 'Europa',
  Asia: 'Asia',
  Africa: 'África',
  'North America': 'América del Norte',
  'South America': 'América del Sur',
  Oceania: 'Oceanía',
  Antarctica: 'Antártida',
};

export const stylesEs: Record<string, string> = {
  'Ancient Egyptian': 'Egipcio antiguo',
  'Ancient Greek': 'Griego antiguo',
  'Ancient Roman': 'Romano antiguo',
  'Art Deco': 'Art Decó',
  'Art Nouveau': 'Art Nouveau',
  Baroque: 'Barroco',
  Bauhaus: 'Bauhaus',
  Brutalism: 'Brutalismo',
  Byzantine: 'Bizantino',
  'Chinese Imperial': 'Imperial chino',
  Contemporary: 'Contemporáneo',
  Deconstructivism: 'Deconstructivismo',
  Ethiopian: 'Etíope',
  Expressionism: 'Expresionismo',
  Gothic: 'Gótico',
  'High-tech': 'Alta tecnología',
  Inca: 'Inca',
  Industrial: 'Industrial',
  'International Style': 'Estilo internacional',
  Islamic: 'Islámico',
  Japanese: 'Japonés',
  'Javanese Buddhist': 'Budista javanés',
  Khmer: 'Jemer',
  Maya: 'Maya',
  Medieval: 'Medieval',
  Modernism: 'Movimiento moderno',
  Moorish: 'Morisco',
  Mughal: 'Mogol',
  Nabataean: 'Nabateo',
  Neoclassical: 'Neoclásico',
  Norman: 'Normando',
  Organic: 'Orgánico',
  Postmodern: 'Posmoderno',
  Prehistoric: 'Prehistórico',
  Renaissance: 'Renacimiento',
  Romanesque: 'Románico',
  'Romanesque Revival': 'Neorrománico',
  'Russian Orthodox': 'Ortodoxo ruso',
  Shona: 'Shona',
  'Structural Expressionism': 'Expresionismo estructural',
  'Gothic Revival': 'Neogótico',
  Mudéjar: 'Mudéjar',
  Manueline: 'Manuelino',
  'Neo-Baroque': 'Neobarroco',
  'Space Age': 'Era espacial',
  'Neo-Renaissance': 'Neorrenacentista',
  'National Romanticism': 'Romanticismo nacional',
  Romanticism: 'Romanticismo',
  'Beaux-Arts': 'Beaux-Arts',
  Georgian: 'Georgiano',
  'Mediterranean Revival': 'Neomediterráneo',
  'Prairie School': 'Escuela de la Pradera',
  Châteauesque: 'Estilo château',
  'Second Empire': 'Segundo Imperio',
  'Flemish Renaissance': 'Renacimiento flamenco',
  Ottoman: 'Otomano',
  'Ancient Persian': 'Persa antiguo',
  Safavid: 'Safaví',
  Qajar: 'Qayarí',
  Abbasid: 'Abasí',
  Umayyad: 'Omeya',
  Rajput: 'Rajput',
  'Indo-Saracenic': 'Indosarraceno',
  Dravidian: 'Dravídico',
  Kalinga: 'Kalinga',
  Buddhist: 'Budista',
  'Bengal Sultanate': 'Sultanato de Bengala',
  Sinhalese: 'Cingalés',
  Burmese: 'Birmano',
  Thai: 'Tailandés',
  Lao: 'Lao',
  Nguyen: 'Nguyen',
  Korean: 'Coreano',
  Tibetan: 'Tibetano',
  'Javanese Hindu': 'Hindú javanés',
  Vernacular: 'Vernáculo',
  'Sudano-Sahelian': 'Sudanosaheliano',
  Swahili: 'Suajili',
  Nubian: 'Nubio',
  Italianate: 'Italianizante',
  'Micronesian': 'Micronesio',
  'Hawaiian Renaissance': 'Renacimiento hawaiano',
  Tudor: 'Tudor',
  Polynesian: 'Polinesio',
  Teotihuacano: 'Teotihuacano',
  Colonial: 'Colonial',
  Aksumite: 'Aksumita',
  Sikh: 'Sij',
  'Indo-Islamic': 'Indoislámico',
  Timurid: 'Timurí',
  Yemeni: 'Yemení',
  ...stylesEsExtra,
};

export const formFamiliesEs: Record<string, string> = {
  Religious: 'Religioso',
  Funerary: 'Funerario',
  Commemorative: 'Conmemorativo',
  Residential: 'Residencial',
  Governmental: 'Gubernamental',
  'High-rise': 'Rascacielos',
  Cultural: 'Cultural',
  Educational: 'Educativo',
  Spectacle: 'Espectáculo',
  Fortification: 'Fortificación',
  Infrastructure: 'Infraestructura',
  Tower: 'Torre',
  Settlement: 'Asentamiento',
  Ceremonial: 'Ceremonial',
  Research: 'Investigación',
  Commercial: 'Comercial',
  Transport: 'Transporte',
};

export const typesEs: Record<string, string> = {
  Abbey: 'Abadía',
  Amphitheatre: 'Anfiteatro',
  'Apartment building': 'Edificio de viviendas',
  Aqueduct: 'Acueducto',
  Basilica: 'Basílica',
  'Bell tower': 'Campanario',
  Bridge: 'Puente',
  Castle: 'Castillo',
  Cathedral: 'Catedral',
  Chapel: 'Capilla',
  Church: 'Iglesia',
  Citadel: 'Ciudadela',
  'Concert hall': 'Sala de conciertos',
  'Cultural centre': 'Centro cultural',
  Dam: 'Presa',
  House: 'Casa',
  Library: 'Biblioteca',
  Mausoleum: 'Mausoleo',
  Memorial: 'Monumento conmemorativo',
  Mosque: 'Mezquita',
  Museum: 'Museo',
  'Observation tower': 'Torre de observación',
  'Office tower': 'Torre de oficinas',
  'Official residence': 'Residencia oficial',
  'Opera house': 'Ópera',
  Palace: 'Palacio',
  Parliament: 'Parlamento',
  Pyramid: 'Pirámide',
  'Research station': 'Estación de investigación',
  School: 'Escuela',
  Skyscraper: 'Rascacielos',
  Stadium: 'Estadio',
  Statue: 'Estatua',
  'Stone circle': 'Círculo de piedra',
  'Stone city': 'Ciudad de piedra',
  Temple: 'Templo',
  'Temple pyramid': 'Pirámide-templo',
  Tomb: 'Tumba',
  Villa: 'Villa',
  Fortress: 'Fortaleza',
  Monastery: 'Monasterio',
  'City gate': 'Puerta de la ciudad',
  'Office building': 'Edificio de oficinas',
  'City hall': 'Ayuntamiento',
  'Railway station': 'Estación de ferrocarril',
  'Airport terminal': 'Terminal aeroportuaria',
  'Government building': 'Edificio gubernamental',
  Hotel: 'Hotel',
  Theatre: 'Teatro',
  Stupa: 'Estupa',
  Pagoda: 'Pagoda',
  'Exhibition building': 'Pabellón de exposiciones',
  'Fortified village': 'Aldea fortificada',
  Monument: 'Monumento',
  Tower: 'Torre',
  Canal: 'Canal',
  Shrine: 'Santuario',
  Madrasah: 'Madraza',
  Trilithon: 'Trilito',
  Obelisk: 'Obelisco',
  ...typesEsExtra,
};

export const usesEs: Record<string, string> = {
  Ceremonial: 'Ceremonial',
  Commemorative: 'Conmemorativo',
  Commercial: 'Comercial',
  Cultural: 'Cultural',
  Defensive: 'Defensivo',
  Educational: 'Educativo',
  Entertainment: 'Entretenimiento',
  Funerary: 'Funerario',
  Governmental: 'Gubernamental',
  Infrastructure: 'Infraestructura',
  'Mixed use': 'Uso mixto',
  Religious: 'Religioso',
  Research: 'Investigación',
  Residential: 'Residencial',
  Tourism: 'Turismo',
  Transport: 'Transporte',
};

export const materialsEs: Record<string, string> = {
  Andesite: 'Andesita',
  Basalt: 'Basalto',
  Bluestone: 'Dolerita',
  Brick: 'Ladrillo',
  Bronze: 'Bronce',
  'Ceramic tile': 'Azulejo',
  'Composite panels': 'Paneles compuestos',
  Concrete: 'Hormigón',
  Glass: 'Vidrio',
  'Gold leaf': 'Pan de oro',
  Granite: 'Granito',
  Iron: 'Hierro',
  Laterite: 'Laterita',
  Lead: 'Plomo',
  Limestone: 'Caliza',
  Marble: 'Mármol',
  Plaster: 'Yeso',
  Plastic: 'Plástico',
  'Portland stone': 'Piedra de Portland',
  'Reinforced concrete': 'Hormigón armado',
  Sandstone: 'Arenisca',
  Sarsen: 'Sarsen',
  Soapstone: 'Esteatita',
  'Stained glass': 'Vidrieras',
  Steel: 'Acero',
  Stone: 'Piedra',
  Stucco: 'Estuco',
  'Terracotta tile': 'Teja de terracota',
  Tile: 'Azulejo',
  Timber: 'Madera',
  Titanium: 'Titanio',
  Travertine: 'Travertino',
  Tuff: 'Toba',
  Wood: 'Madera',
  'Wrought iron': 'Hierro forjado',
  Copper: 'Cobre',
  Aluminium: 'Aluminio',
  Adobe: 'Adobe',
  Mudbrick: 'Ladrillo de barro',
  'Coral stone': 'Piedra coral',
  Mosaic: 'Mosaico',
  Cardboard: 'Cartón',
  Terracotta: 'Terracota',
  ...materialsEsExtra,
};

const buildingEsBase: Record<string, BuildingCopyEs> = {
  'petra-treasury': {
    name: 'Al-Khazneh',
    city: 'Petra',
    yearNote: 'Construida hacia el siglo I d. C.',
    blurb:
      'Una monumental fachada de tumba excavada en la roca en Petra, tallada en un acantilado de arenisca por los nabateos.',
    fact:
      'Su nombre significa «el tesoro»; una leyenda local decía que un faraón escondió un tesoro en la urna de la parte superior.',
    aliases: ['Tesoro de Petra'],
  },
  alhambra: {
    name: 'Alhambra',
    city: 'Granada',
    yearNote: 'Los principales palacios nazaríes se completaron en el siglo XIV',
    blurb:
      'Un palacio y fortaleza en una colina, construido por los emires nazaríes y famoso por sus patios, su yesería y sus azulejos.',
    fact: 'El Patio de los Leones tiene una fuente sostenida por doce leones de piedra.',
  },
  'angkor-wat': {
    name: 'Angkor Wat',
    city: 'Siem Reap',
    yearNote: 'Construido hacia 1113–1150',
    blurb:
      'El monumento religioso más grande del mundo, construido por Suryavarman II y dedicado a Vishnu.',
    fact:
      'Sus cinco torres representan el monte Meru, el hogar de los dioses en la cosmología hinduista.',
  },
  'bauhaus-dessau': {
    name: 'Bauhaus Dessau',
    city: 'Dessau',
    blurb:
      'El edificio escolar que se convirtió en la imagen del movimiento Bauhaus, con una fachada de vidrio y una planta funcional.',
    fact:
      'El lettering de la fachada lo diseñó Herbert Bayer y se convirtió en un icono del diseño gráfico moderno.',
  },
  'birds-nest': {
    name: 'Estadio Nacional de Pekín',
    city: 'Pekín',
    blurb:
      'El estadio «Nido de Pájaro», construido para los Juegos Olímpicos de 2008 y envuelto por una retícula de acero vista.',
    fact:
      'El techo de acero se eliminó del diseño para reducir costes; quedó la icónica retícula abierta.',
    aliases: ['Nido de Pájaro', 'El Nido'],
  },
  'bibliotheca-alexandrina': {
    name: 'Bibliotheca Alexandrina',
    city: 'Alejandría',
    blurb:
      'Una biblioteca y centro cultural moderno cerca del lugar donde se encontraba la antigua Biblioteca de Alejandría.',
    fact:
      'Su techo de vidrio inclinado tiene forma de disco solar, y la sala de lectura desciende hacia el mar.',
  },
  borobudur: {
    name: 'Borobudur',
    city: 'Magelang',
    yearNote: 'Terminado hacia 825',
    blurb:
      'Un enorme templo budista mahayana en Java, construido como un mandala escalonado con 2.672 paneles de relieves.',
    fact:
      'Permaneció oculto bajo ceniza volcánica y selva durante siglos antes de ser restaurado en el siglo XX.',
  },
  'burj-khalifa': {
    name: 'Burj Khalifa',
    city: 'Dubái',
    blurb: 'El edificio más alto del mundo, una torre escalonada de 828 m sobre Dubái.',
    fact:
      'Su diseño se inspira en la flor Hymenocallis y en los patrones geométricos islámicos.',
  },
  'casa-batllo': {
    name: 'Casa Batlló',
    city: 'Barcelona',
    blurb:
      'Una casa reformada por Gaudí con una fachada de piedra que parece hueso, un tejado con escamas y un interior marino.',
    fact:
      'Los balcones de la fachada parecen máscaras de carnaval; el tejado se compara a menudo con el lomo de un dragón.',
  },
  'brasilia-cathedral': {
    name: 'Catedral de Brasilia',
    city: 'Brasilia',
    blurb:
      'La catedral hiperboloide de Oscar Niemeyer, una corona de nervios de hormigón y vidrio en la capital planificada.',
    fact:
      'Las 16 columnas curvas de hormigón pesan 90 toneladas cada una y sostienen un techo de vidrio.',
  },
  'cctv-headquarters': {
    name: 'Sede de CCTV',
    city: 'Pekín',
    blurb:
      'Una torre en forma de bucle formada por dos volúmenes inclinados unidos arriba y abajo, sede de China Central Television.',
    fact:
      'El edificio no tiene la forma tradicional de una torre; su bucle estructural reparte las cargas alrededor del centro abierto.',
  },
  'centre-pompidou': {
    name: 'Centro Pompidou',
    city: 'París',
    blurb:
      'Un centro cultural con la estructura, las tuberías y las escaleras mecánicas a la vista, que pone el edificio del revés.',
    fact:
      'Las tuberías de colores siguen un código: azul para el aire, verde para el agua, amarillo para la electricidad y rojo para la circulación.',
  },
  'chartres-cathedral': {
    name: 'Catedral de Chartres',
    city: 'Chartres',
    yearNote: 'Estructura principal terminada hacia 1220',
    blurb:
      'Una de las catedrales góticas mejor conservadas, famosa por sus vidrieras de los siglos XII y XIII y sus dos agujas.',
    fact: 'Su laberinto en el suelo de la nave mide unos 12,9 m de diámetro.',
  },
  'christ-the-redeemer': {
    name: 'Cristo Redentor',
    city: 'Río de Janeiro',
    blurb:
      'La estatua art déco de Cristo que contempla Río de Janeiro desde el monte Corcovado.',
    fact: 'La estatua recibe varios rayos al año y se repara con esteatita de sustitución.',
  },
  'chrysler-building': {
    name: 'Edificio Chrysler',
    city: 'Nueva York',
    blurb:
      'Una torre art déco con una corona de acero inoxidable y gárgolas inspiradas en los adornos de los coches Chrysler.',
    fact:
      'Su aguja se montó dentro del edificio y se izó en 90 minutos, superando a una torre rival.',
  },
  'cn-tower': {
    name: 'Torre CN',
    city: 'Toronto',
    blurb:
      'Una torre de comunicaciones y observación de hormigón que fue la estructura autoportante más alta del mundo durante más de 30 años.',
    fact: 'Su suelo de cristal permite mirar 342 m en vertical.',
  },
  'cologne-cathedral': {
    name: 'Catedral de Colonia',
    city: 'Colonia',
    yearNote: 'Terminada 632 años después de iniciarse las obras',
    blurb:
      'La iglesia gótica más grande de Alemania, iniciada en 1248 y terminada en 1880 según su diseño medieval.',
    fact:
      'Sus dos agujas la convirtieron en el edificio más alto del mundo entre 1880 y 1884.',
  },
  colosseum: {
    name: 'Coliseo',
    city: 'Roma',
    yearNote: 'Inaugurado en el año 80 d. C.',
    blurb:
      'El anfiteatro más grande jamás construido; el Coliseo acogía hasta 50.000 espectadores en juegos de gladiadores y espectáculos públicos.',
    fact:
      'Su muro exterior tenía tres niveles de arcos y un sistema de toldos retráctiles podía cubrir toda la arena.',
    aliases: ['Coliseo Romano'],
  },
  'eiffel-tower': {
    name: 'Torre Eiffel',
    city: 'París',
    blurb:
      'Una torre de celosía de hierro construida para la Exposición Universal de 1889, hoy símbolo de París.',
    fact:
      'Estaba previsto que se quedara 20 años; las antenas de radio la salvaron de la demolición.',
  },
  'chichen-itza': {
    name: 'El Castillo, Chichén Itzá',
    city: 'Chichén Itzá',
    yearNote: 'Construido hacia 800–900 d. C.',
    blurb:
      'Una pirámide maya escalonada en Chichén Itzá, dedicada al dios serpiente emplumada Kukulcán.',
    fact:
      'En los equinoccios, el sol poniente proyecta una sombra en forma de serpiente sobre la escalera norte.',
    aliases: ['Templo de Kukulcán'],
  },
  'empire-state-building': {
    name: 'Empire State Building',
    city: 'Nueva York',
    blurb:
      'El rascacielos art déco que definió el skyline de Nueva York, terminado en 1931 en solo 13 meses.',
    fact:
      'Fue el edificio más alto del mundo durante casi 40 años y tiene su propio código postal.',
  },
  fallingwater: {
    name: 'Casa de la Cascada',
    city: 'Mill Run, Pensilvania',
    blurb:
      'Una casa de fin de semana en voladizo sobre una cascada, una de las obras maestras de Frank Lloyd Wright.',
    fact:
      'Wright diseñó la casa en torno al sonido de la cascada, que se oye en toda la vivienda.',
  },
  'florence-cathedral': {
    name: 'Catedral de Florencia',
    city: 'Florencia',
    yearNote: 'Consagrada en 1436',
    blurb:
      'La catedral de Florencia, coronada por la pionera cúpula de Brunelleschi, la mayor cúpula de ladrillo y argamasa del mundo.',
    fact:
      'La cúpula se construyó sin cimbras, con una estructura de doble casca y ladrillo a espina de pez.',
    aliases: ['Duomo de Florencia', 'Santa María del Fiore'],
  },
  'forbidden-city': {
    name: 'Ciudad Prohibida',
    city: 'Pekín',
    blurb:
      'El palacio imperial de las dinastías Ming y Qing, un enorme recinto amurallado en el centro de Pekín.',
    fact: 'Conserva 980 edificios y fue el hogar de 24 emperadores.',
  },
  'golden-gate-bridge': {
    name: 'Puente Golden Gate',
    city: 'San Francisco',
    blurb:
      'El puente colgante que cruza el estrecho Golden Gate, famoso por su pintura naranja internacional.',
    fact:
      'Su color se eligió para destacar en la niebla y complementar las colinas cercanas.',
  },
  'great-pyramid-giza': {
    name: 'Gran Pirámide de Guiza',
    city: 'Guiza',
    yearNote: 'Construida hacia 2560 a. C.',
    blurb:
      'La tumba del faraón Keops y la mayor de las pirámides de Guiza, la única maravilla del mundo antiguo que se conserva.',
    fact: 'Fue la estructura humana más alta durante casi 4.000 años.',
    aliases: ['Pirámide de Keops'],
  },
  'great-zimbabwe': {
    name: 'Gran Zimbabue',
    city: 'Masvingo',
    yearNote: 'Construido entre los siglos XI y XV',
    blurb:
      'La capital en ruinas del Reino de Zimbabue, construida con muros de granito en seco, sin argamasa.',
    fact:
      'Su nombre significa «casas de piedra» en shona; el yacimiento dio nombre al país moderno.',
  },
  'guggenheim-ny': {
    name: 'Museo Guggenheim',
    city: 'Nueva York',
    blurb:
      'El museo en espiral de Frank Lloyd Wright en la Quinta Avenida, donde los visitantes recorren una rampa continua.',
    fact:
      'Wright quería que el museo fuera un templo del espíritu; la rampa en espiral mide 400 m.',
  },
  'guggenheim-bilbao': {
    name: 'Museo Guggenheim Bilbao',
    city: 'Bilbao',
    blurb:
      'El museo revestido de titanio de Frank Gehry ayudó a convertir Bilbao en un destino cultural.',
    fact:
      'Los paneles de titanio tienen solo 0,38 mm de grosor y cambian de color con la luz.',
  },
  'habitat-67': {
    name: 'Hábitat 67',
    city: 'Montreal',
    blurb:
      'Un conjunto de viviendas modulares construido para la Expo 67, que apila unidades prefabricadas de hormigón para crear una nueva aldea urbana.',
    fact: 'Safdie lo diseñó como tesis de estudiante antes de realizarlo en la Expo 67.',
  },
  'hagia-sophia': {
    name: 'Santa Sofía',
    city: 'Estambul',
    yearNote: 'Terminada en 537 d. C.',
    blurb:
      'Construida como catedral para Justiniano I, Santa Sofía ha sido iglesia, mezquita y museo a lo largo de 1.500 años.',
    fact: 'Su cúpula central mide 31 m de diámetro y parece flotar sobre un anillo de ventanas.',
  },
  'halley-vi': {
    name: 'Estación de Investigación Halley VI',
    city: 'Barrera de hielo Brunt',
    blurb:
      'Una estación de investigación británica trasladable en la barrera de hielo Brunt, elevada sobre patas hidráulicas para evacuar la nieve.',
    fact:
      'La estación se compone de ocho módulos sobre esquís, diseñados para moverse a medida que la barrera de hielo se desplaza.',
  },
  'hassan-ii-mosque': {
    name: 'Mezquita Hassan II',
    city: 'Casablanca',
    blurb:
      'Una enorme mezquita junto al mar con el alminar más alto del mundo, construida en parte sobre el Atlántico.',
    fact:
      'Su alminar de 210 m es el más alto del mundo; parte de la sala de oración está sobre el océano.',
  },
  'heydar-aliyev-center': {
    name: 'Centro Heydar Aliyev',
    city: 'Bakú',
    blurb:
      'El fluido centro cultural de Zaha Hadid, con una superficie curva continua que surge de la plaza.',
    fact:
      'El edificio casi no tiene líneas rectas; su piel está formada por miles de paneles individuales.',
  },
  'himeji-castle': {
    name: 'Castillo de Himeji',
    city: 'Himeji',
    blurb:
      'El castillo feudal más grande y mejor conservado de Japón, conocido como el Castillo de la Garza Blanca por sus muros de yeso blanco.',
    fact:
      'Su diseño defensivo incluye caminos en espiral, habitaciones ocultas y aberturas para arrojar piedras a los atacantes.',
  },
  'hoover-dam': {
    name: 'Presa Hoover',
    city: 'Frontera Nevada–Arizona',
    blurb:
      'Una presa de arco-gravedad de hormigón en el río Colorado, con detalles art déco y una escala monumental.',
    fact:
      'Su hormigón sigue curándose; la presa genera energía suficiente para unos 700.000 hogares.',
  },
  karnak: {
    name: 'Karnak',
    city: 'Luxor',
    yearNote: 'La Gran Sala Hipóstila se terminó hacia 1290 a. C.',
    blurb:
      'Un vasto complejo templario dedicado a Amón-Ra, construido y ampliado durante más de un milenio.',
    fact:
      'Su Gran Sala Hipóstila tiene 134 columnas, algunas de más de 20 m de altura.',
  },
  'kinkaku-ji': {
    name: 'Kinkaku-ji',
    city: 'Kioto',
    yearNote: 'Pabellón original de 1397; reconstrucción actual de 1955',
    blurb:
      'El Pabellón Dorado, un templo zen cubierto de pan de oro que se refleja en un estanque.',
    fact:
      'El pabellón actual es una reconstrucción de 1955, después de que un monje incendiara el original en 1950.',
    aliases: ['Pabellón Dorado'],
  },
  'lalibela-churches': {
    name: 'Iglesias de Lalibela',
    city: 'Lalibela',
    yearNote: 'Talladas hacia los siglos XII–XIII',
    blurb:
      'Once iglesias medievales excavadas hacia abajo en roca volcánica maciza en las tierras altas de Etiopía.',
    fact:
      'Las iglesias están conectadas por túneles y zanjas, todos tallados en una única masa de roca.',
  },
  'leaning-tower-pisa': {
    name: 'Torre Inclinada de Pisa',
    city: 'Pisa',
    yearNote: 'Terminada en 1372',
    blurb:
      'El campanario exento de la catedral de Pisa, famoso por su inclinación involuntaria.',
    fact:
      'Su inclinación llegó a 5,5 grados antes de que un proyecto de estabilización la enderezara hasta unos 4 grados.',
  },
  'lincoln-memorial': {
    name: 'Monumento a Lincoln',
    city: 'Washington D. C.',
    blurb:
      'Un templo griego en el National Mall que honra a Abraham Lincoln, con una estatua sedente de mármol de Daniel Chester French.',
    fact:
      'Martin Luther King Jr. pronunció su discurso «I Have a Dream» desde sus escalones en 1963.',
    aliases: ['Memorial de Lincoln'],
  },
  'lotus-temple': {
    name: 'Templo del Loto',
    city: 'Nueva Delhi',
    blurb:
      'Un templo bahá\'í con forma de flor de loto, abierto a personas de todas las religiones.',
    fact:
      'Sus 27 pétalos de mármol forman nueve entradas; el edificio ha recibido premios por su eficiencia energética.',
  },
  'machu-picchu': {
    name: 'Machu Picchu',
    city: 'Machu Picchu',
    yearNote: 'Construido hacia 1450',
    blurb:
      'Una ciudadela inca del siglo XV en una cresta sobre el valle del Urubamba, construida sin argamasa con granito ajustado.',
    fact:
      'Sus muros de piedra están tan bien encajados que una hoja de cuchillo no puede pasar entre muchos bloques.',
  },
  'mont-saint-michel': {
    name: 'Monte Saint-Michel',
    city: 'Normandía',
    yearNote: 'Coro gótico de la abadía terminado hacia 1521',
    blurb:
      'Una abadía y fortaleza en una isla mareal frente a Normandía, construida durante siglos alrededor de un monasterio benedictino.',
    fact:
      'Con la marea alta, la isla queda aislada; un paso elevado y un puente controlan ahora el acceso.',
  },
  'mosque-cathedral-cordoba': {
    name: 'Mezquita-Catedral de Córdoba',
    city: 'Córdoba',
    yearNote: 'Mezquita terminada hacia 987; catedral insertada después de 1236',
    blurb:
      'Una antigua mezquita omeya con un bosque de arcos de doble altura, convertida después en catedral.',
    fact:
      'Su sala de oración llegó a tener unas 1.000 columnas de mármol, granito y jaspe.',
  },
  neuschwanstein: {
    name: 'Castillo de Neuschwanstein',
    city: 'Schwangau',
    yearNote: 'Abierto tras la muerte de Luis II; nunca se terminó por completo',
    blurb:
      'El castillo de cuento de hadas de Luis II en los Alpes bávaros, una reinterpretación romántica de la arquitectura medieval.',
    fact:
      'Inspiró el Castillo de la Bella Durmiente de Disney y recibe más de un millón de visitantes al año.',
  },
  'notre-dame-paris': {
    name: 'Notre-Dame de París',
    city: 'París',
    yearNote: 'Coro y nave terminados hacia 1345',
    blurb:
      'Un monumento fundacional del gótico en la Île de la Cité, conocido por sus arbotantes y rosetones.',
    fact:
      'El incendio de 2019 destruyó la aguja y el tejado; la catedral reabrió en diciembre de 2024.',
    aliases: ['Nuestra Señora de París'],
  },
  'notre-dame-du-haut': {
    name: 'Notre-Dame du Haut',
    city: 'Ronchamp',
    blurb:
      'La capilla escultórica de Le Corbusier en Ronchamp, con gruesos muros curvos y ventanas irregulares.',
    fact: 'La cubierta es una única cáscara curva que parece flotar sobre los muros.',
  },
  'palace-versailles': {
    name: 'Palacio de Versalles',
    city: 'Versalles',
    yearNote: 'La corte real se trasladó allí en 1682',
    blurb:
      'El vasto palacio real de Luis XIV, con el Salón de los Espejos y unos jardines que se convirtieron en modelo para las cortes europeas.',
    fact: 'El Salón de los Espejos contiene 357 espejos y 17 arcos.',
  },
  pantheon: {
    name: 'Panteón',
    city: 'Roma',
    yearNote: 'Reconstruido bajo Adriano, hacia 113–126 d. C.',
    blurb:
      'Un antiguo templo romano con la mayor cúpula de hormigón sin armar del mundo, intacta después de casi 1.900 años.',
    fact: 'El óculo de la cúpula mide 8,2 m de ancho y está abierto al cielo.',
  },
  'parliament-house-canberra': {
    name: 'Parlamento de Australia',
    city: 'Canberra',
    blurb:
      'La sede del Parlamento australiano, integrada en Capital Hill con una cubierta de hierba y una gran plaza pública.',
    fact:
      'El edificio está diseñado para que el poder ejecutivo y el legislativo se sitúen a lados opuestos de un eje central.',
  },
  parthenon: {
    name: 'Partenón',
    city: 'Atenas',
    yearNote: 'Terminado en 438 a. C.',
    blurb:
      'El templo de Atenea Partenos en la Acrópolis, símbolo de la Grecia clásica y del orden dórico.',
    fact:
      'Sus columnas se inclinan ligeramente hacia dentro y se engrosan en el centro para corregir distorsiones ópticas.',
  },
  'petronas-towers': {
    name: 'Torres Petronas',
    city: 'Kuala Lumpur',
    blurb:
      'Dos torres gemelas unidas por un puente, que fueron los edificios más altos del mundo y siguen siendo las torres gemelas más altas.',
    fact:
      'Las torres tienen motivos geométricos islámicos y un puente en la planta 41.',
  },
  'pont-du-gard': {
    name: 'Puente del Gard',
    city: 'Vers-Pont-du-Gard',
    yearNote: 'Construido hacia el año 50 d. C.',
    blurb:
      'Un puente-acueducto romano de tres niveles que llevó agua a Nimes durante siglos.',
    fact:
      'Es el más alto de los acueductos romanos elevados y Patrimonio de la Humanidad de la UNESCO.',
  },
  reichstag: {
    name: 'Reichstag',
    city: 'Berlín',
    yearNote: 'Terminado en 1894; cúpula de vidrio añadida en 1999',
    blurb:
      'El edificio del parlamento alemán, reconstruido tras la Guerra Fría con una cúpula de vidrio transparente de Norman Foster.',
    fact:
      'El cono espejado de la cúpula dirige la luz del día a la cámara de debate y evacúa el aire caliente.',
    aliases: ['Parlamento alemán'],
  },
  'seagram-building': {
    name: 'Edificio Seagram',
    city: 'Nueva York',
    blurb:
      'La torre de bronce y vidrio de Mies van der Rohe, modelo del Estilo Internacional y del bloque de oficinas moderno.',
    fact:
      'Su plaza retrasó la torre respecto a Park Avenue y creó un espacio público que cambió la zonificación de Nueva York.',
  },
  'sheikh-zayed-mosque': {
    name: 'Gran Mezquita Sheikh Zayed',
    city: 'Abu Dabi',
    blurb:
      'Una de las mezquitas más grandes del mundo, con 82 cúpulas, más de 1.000 columnas y un enorme patio de mármol.',
    fact:
      'Su sala de oración principal tiene la alfombra anudada a mano más grande del mundo y una de las lámparas colgantes más grandes.',
  },
  'st-basils-cathedral': {
    name: 'Catedral de San Basilio',
    city: 'Moscú',
    blurb:
      'Un conjunto de cúpulas bulbosas pintadas con vivos colores en la Plaza Roja, encargado por Iván el Terrible.',
    fact:
      'Su nombre oficial es Catedral de Basilio el Bendito, no una basílica dedicada a san Basilio.',
    aliases: ['San Basilio'],
  },
  'st-pauls-cathedral': {
    name: 'Catedral de San Pablo',
    city: 'Londres',
    blurb:
      'La catedral con cúpula de Christopher Wren, construida tras el Gran Incendio de Londres y todavía un símbolo de la ciudad.',
    fact: 'La Galería de los Susurros transmite un susurro por el interior de la cúpula.',
  },
  'st-peters-basilica': {
    name: 'Basílica de San Pedro',
    city: 'Ciudad del Vaticano',
    yearNote: 'Consagrada en 1626',
    blurb:
      'La basílica renacentista y barroca en el corazón del Vaticano, construida sobre la tumba de san Pedro.',
    fact:
      'Su cúpula, diseñada por Miguel Ángel, mide 136,6 m de altura e inspiró cúpulas de iglesias de todo el mundo.',
    aliases: ['San Pedro'],
  },
  stonehenge: {
    name: 'Stonehenge',
    city: 'Wiltshire',
    yearNote: 'Círculo de sarsen erigido hacia 2500 a. C.',
    blurb:
      'Un anillo prehistórico de piedras erectas en Salisbury Plain, alineado con los solsticios.',
    fact:
      'Las piedras azules se trasladaron unos 250 km desde las colinas de Preseli, en Gales.',
  },
  'sydney-harbour-bridge': {
    name: 'Puente de la Bahía de Sídney',
    city: 'Sídney',
    blurb:
      'Un puente de arco de acero que cruza la bahía de Sídney, apodado «la percha».',
    fact:
      'Su arco de 503 m lo convierte en uno de los puentes de gran luz más anchos del mundo.',
  },
  'sydney-opera-house': {
    name: 'Ópera de Sídney',
    city: 'Sídney',
    blurb:
      'La ópera en forma de velas de Jørn Utzon en la bahía de Sídney, Patrimonio de la Humanidad de la UNESCO.',
    fact:
      'Su cubierta está revestida con 1.056.006 tejas cerámicas fabricadas en Suecia.',
  },
  'taipei-101': {
    name: 'Taipéi 101',
    city: 'Taipéi',
    blurb:
      'Un rascacielos inspirado en el bambú que fue el edificio más alto del mundo entre 2004 y 2010.',
    fact:
      'Un amortiguador de masa de 660 toneladas cerca de la cima estabiliza la torre durante tifones y terremotos.',
  },
  'taj-mahal': {
    name: 'Taj Mahal',
    city: 'Agra',
    blurb:
      'Un mausoleo de mármol blanco construido por Shah Jahan para su esposa Mumtaz Mahal, obra maestra de la arquitectura mogol.',
    fact:
      'Sus alminares se inclinan ligeramente hacia fuera para que, en un terremoto, caigan lejos de la tumba.',
  },
  'te-papa': {
    name: 'Te Papa',
    city: 'Wellington',
    blurb:
      'El museo nacional de Nueva Zelanda, con una audaz fachada contemporánea en el paseo marítimo de Wellington.',
    fact:
      'Su nombre significa «contenedor de tesoros» en maorí; el edificio incluye un marae y una exposición de calamares colosales.',
  },
  'temple-of-heaven': {
    name: 'Templo del Cielo',
    city: 'Pekín',
    blurb:
      'Un templo imperial circular donde los emperadores rezaban por buenas cosechas, situado en un gran parque.',
    fact:
      'Su Salón de Oración por las Buenas Cosechas se construyó sin un solo clavo.',
  },
  'tower-of-london': {
    name: 'Torre de Londres',
    city: 'Londres',
    yearNote: 'Torre Blanca iniciada en 1078; murallas exteriores terminadas en 1285',
    blurb:
      'Una fortaleza real junto al Támesis, iniciada por Guillermo el Conquistador y ampliada durante siglos.',
    fact: 'Las joyas de la Corona se guardan allí desde el siglo XVII.',
  },
  'us-capitol': {
    name: 'Capitolio de los Estados Unidos',
    city: 'Washington D. C.',
    blurb:
      'La sede del Congreso de Estados Unidos, coronada por una cúpula de hierro fundido terminada durante la Guerra Civil.',
    fact:
      'La Estatua de la Libertad que corona la cúpula fue montada por trabajadores esclavizados en 1863.',
    aliases: ['Capitolio'],
  },
  'villa-savoye': {
    name: 'Villa Savoye',
    city: 'Poissy',
    blurb:
      'El manifiesto de Le Corbusier de los Cinco Puntos de la Arquitectura: pilotis, planta libre, ventanas alargadas, jardín en la azotea y fachada libre.',
    fact:
      'La casa estuvo a punto de ser demolida en los años sesenta antes de restaurarse como museo.',
  },
  'disney-concert-hall': {
    name: 'Sala de Conciertos Walt Disney',
    city: 'Los Ángeles',
    blurb:
      'La sala de conciertos de acero inoxidable de Frank Gehry, sede de la Filarmónica de Los Ángeles.',
    fact:
      'Los paneles curvos de acero iban a ser originalmente de piedra; el diseño cambió tras revisiones de presupuesto y acústica.',
  },
  'white-house': {
    name: 'Casa Blanca',
    city: 'Washington D. C.',
    blurb:
      'La residencia oficial y lugar de trabajo del presidente de Estados Unidos, diseñada en un sobrio estilo neoclásico.',
    fact:
      'Se ha reconstruido y ampliado muchas veces, incluso después de que las tropas británicas la incendiaran en 1814.',
    aliases: ['La Casa Blanca'],
  },
};

export const buildingEs: Record<string, BuildingCopyEs> = {
  ...buildingEsBase,
  ...buildingExtraEs,
  ...buildingIconsEs,
  ...buildingProposalEs,
};
