window.DAXI_CONFIG = {
  isDemo: true,
  schemaVersion: 1,
  brand: { amber: '#FDA621', dark: '#0E0D0B' },
  facts: {
    cars: 100,
    legalizationDays: '5-10',
    certificateDays: 14,
    minDrivingYears: 3,
    referralBonus: 2000,
    fixedRentPerDay: 600,
    support: '24/7'
  },
  finance: {
    grossPerHourByClass: { standard: 150, comfort: 175, comfortPlus: 205, electric: 185 },
    commissionTiers: [
      { ordersFrom: 0, percent: 12 },
      { ordersFrom: 70, percent: 10 },
      { ordersFrom: 120, percent: 8 }
    ],
    ordersPerHour: 1.8,
    rangePercent: 15,
    weeksPerMonth: 4.33,
    ownerSharePercent: 65,
    businessSharePercent: 70,
    ownerOperatingExpensePercent: 18
  },
  eligibility: {
    minCarYear: 2012,
    eligibleModels: [
      'Toyota Prius 30','Toyota Prius 50','Toyota Prius V/+','Hyundai Sonata','Kia Optima','Ford Fusion','Ford Mondeo Hybrid','Skoda Octavia','Volkswagen Passat','Volkswagen ID.4','Tesla Model 3','Tesla Model Y','Renault Megane','Dacia Logan','Chevrolet Cruze','Opel Astra','Honda Civic','Nissan Sentra','Subaru Impreza','Peugeot 508','SEAT Leon ST','Citroen C5','Volvo S60','Lexus ES','Mercedes E-Class','Mitsubishi Outlander','Infiniti Q50','Audi A7'
    ]
  },
  catalog: {
    'Toyota': ['Prius 30','Prius 50','Prius V/+'],
    'Hyundai': ['Sonata'],
    'Kia': ['Optima'],
    'Ford': ['Fusion','Mondeo Hybrid'],
    'Skoda': ['Octavia'],
    'Volkswagen': ['Passat','ID.4'],
    'Tesla': ['Model 3','Model Y'],
    'Renault': ['Megane'],
    'Dacia': ['Logan'],
    'Chevrolet': ['Cruze'],
    'Opel': ['Astra'],
    'Honda': ['Civic'],
    'Nissan': ['Sentra'],
    'Subaru': ['Impreza'],
    'Peugeot': ['508'],
    'SEAT': ['Leon ST'],
    'Citroen': ['C5'],
    'Volvo': ['S60'],
    'Lexus': ['ES'],
    'Mercedes': ['E-Class'],
    'Mitsubishi': ['Outlander'],
    'Infiniti': ['Q50'],
    'Audi': ['A7']
  },
  modelToClass: {
    'Toyota Prius 30':'standard','Toyota Prius 50':'comfort','Toyota Prius V/+':'comfort',
    'Hyundai Sonata':'comfort','Kia Optima':'comfort','Ford Fusion':'comfort','Ford Mondeo Hybrid':'comfort',
    'Skoda Octavia':'standard','Volkswagen Passat':'comfort','Volkswagen ID.4':'electric',
    'Tesla Model 3':'electric','Tesla Model Y':'electric','Renault Megane':'standard','Dacia Logan':'standard',
    'Chevrolet Cruze':'standard','Opel Astra':'standard','Honda Civic':'standard','Nissan Sentra':'standard',
    'Subaru Impreza':'standard','Peugeot 508':'comfort','SEAT Leon ST':'comfort','Citroen C5':'comfort',
    'Volvo S60':'comfortPlus','Lexus ES':'comfortPlus','Mercedes E-Class':'comfortPlus',
    'Mitsubishi Outlander':'comfort','Infiniti Q50':'comfortPlus','Audi A7':'comfortPlus'
  },
  years: Array.from({length: 19}, (_, i) => 2026 - i),
  buyoutCars: [
    { model:'Volkswagen ID.4', year:2022, class:'electric', image:'https://daxi.md/assets/themes/daxi/img/catalog/10.webp' },
    { model:'Toyota Prius 50', year:2018, class:'comfort', image:'https://daxi.md/assets/themes/daxi/img/catalog/5.webp' },
    { model:'Ford Fusion', year:2019, class:'comfort', image:'https://daxi.md/assets/themes/daxi/img/catalog/7.webp' }
  ],
  managers: [{ name: {ru:'Менеджер Daxi',ro:'Manager Daxi'}, phone:'+37376077101', initials:'DX' }],
  app: {
    googlePlay: 'https://play.google.com/store/apps/details?id=md.daxi.app',
    appStore: 'https://apps.apple.com/ro/app/daxi-md/id6815605891'
  },
  appScreens: [
    'https://play-lh.googleusercontent.com/fphnfu-aav6qN6r-6CdP_bazVrKqAyrR7oD1nTuok4LkXoIIckfuK6L9YBbU-fWSV3QXtcIgBE5WMnZ7QOpL=w1080',
    'https://play-lh.googleusercontent.com/Z8bijZG5el5Ux3pY4qehzaslSJdwCefSfpxOsw9UBBkIg7P8mq9S7cu8spvZ11-YtN1RTF0uQUtJEan7xgmifw=w1080'
  ],
  contact: {
    address:'str. Nicolae Testemițanu 4, Chișinău',
    phones:['+373 22 022 861','+373 76 077 101'],
    phoneLinks:['+37322022861','+37376077101'],
    whatsapp:'37376077101',
    telegram:'https://t.me/DaxiPartner',
    tiktok:'https://www.tiktok.com/@daxi.md'
  },
  integrations: {
    crmWebhook: '',
    metaPixelId: '',
    tiktokPixelId: ''
  }
};