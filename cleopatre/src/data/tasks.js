// ==========================================
// TÂCHES DE CLÉOPÂTRE
// ==========================================

// Tiers de difficulté (basés sur le temps de jeu):
// 1 = Début de partie (0-2 min) - Bâtiments Tier 1 uniquement
// 2 = Partie précoce (2-5 min) - Bâtiments Tier 1 + début Tier 2
// 3 = Mi-partie (5-10 min) - Bâtiments Tier 1 & 2
// 4 = Partie avancée (10-20 min) - Bâtiments Tier 2 & début Tier 3
// 5 = Fin de partie (20+ min) - Bâtiments Tier 3

// Tâches que Cléopâtre peut demander
const CLEOPATRA_TASKS = [
    // ================== TIER 1 - DÉBUT (Bâtiments Tier 1) ==================
    {
        id: 'build_hut',
        type: 'build',
        name: 'Construire des huttes',
        description: 'Cléopâtre veut {count} hutte(s)',
        building: 'hut',
        count: [2, 3, 4],
        tier: 1,
        timeLimit: 60,
        reward: 100,
        penalty: 'death',
        messages: {
            start: "Mon peuple a besoin d'abris ! Construisez {count} hutte(s) !",
            reminder: "Ces huttes ne vont pas se construire toutes seules !",
            success: "Bien. Ces huttes abriteront mon peuple.",
            failure: "Vous ne pouvez même pas construire quelques huttes..."
        }
    },
    {
        id: 'build_house',
        type: 'build',
        name: 'Construire des maisons',
        description: 'Cléopâtre veut {count} maison(s)',
        building: 'house',
        count: [1, 2],
        tier: 1,
        timeLimit: 90,
        reward: 180,
        penalty: 'death',
        messages: {
            start: "Mon village a besoin de logements. Construisez {count} maison(s) !",
            reminder: "Le temps presse ! Où sont mes maisons ?",
            success: "Excellent travail ! Voici votre récompense.",
            failure: "Vous m'avez déçue pour la dernière fois..."
        }
    },
    {
        id: 'build_field',
        type: 'build',
        name: 'Créer un champ',
        description: 'Cléopâtre veut {count} champ(s)',
        building: 'field',
        count: [1, 2],
        tier: 1,
        timeLimit: 80,
        reward: 100,
        penalty: 'death',
        messages: {
            start: "La famine menace ! Créez {count} champ(s) pour nourrir mon peuple !",
            reminder: "Les ventres grondent ! Où sont les champs ?",
            success: "La terre donnera ses fruits grâce à vous.",
            failure: "Si mon peuple meurt de faim, vous mourrez aussi."
        }
    },
    {
        id: 'build_well',
        type: 'build',
        name: 'Construire un puits',
        description: 'Cléopâtre demande {count} puits',
        building: 'well',
        count: [1],
        tier: 1,
        timeLimit: 70,
        reward: 120,
        penalty: 'death',
        messages: {
            start: "Mon peuple a soif ! Construisez un puits immédiatement !",
            reminder: "L'eau est la vie ! Dépêchez-vous !",
            success: "L'eau coule, vous avez bien servi.",
            failure: "Sans eau, vous ne méritez pas de vivre non plus."
        }
    },
    {
        id: 'gather_basic',
        type: 'gather',
        name: 'Collecter des ressources',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['wood', 'dirt'],
        count: [10, 15, 20],
        tier: 1,
        timeLimit: 90,
        reward: 60,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "J'ai besoin de {count} {resource} pour mes projets. Rassemblez-les !",
            reminder: "Où sont mes ressources ? Le temps presse !",
            success: "Ces ressources serviront bien l'Égypte.",
            failure: "Vous ne pouvez même pas collecter quelques ressources..."
        }
    },

    // ================== TIER 2 - PARTIE PRÉCOCE (Bâtiments Tier 1 avancés) ==================
    {
        id: 'build_farm',
        type: 'build',
        name: 'Construire une ferme',
        description: 'Cléopâtre veut {count} ferme(s)',
        building: 'farm',
        count: [1, 2],
        tier: 2,
        timeLimit: 100,
        reward: 200,
        penalty: 'death',
        messages: {
            start: "Une ferme produira nourriture et logement ! Construisez-en {count} !",
            reminder: "Ma ferme ! Où est-elle ?",
            success: "Cette ferme nourrira mon peuple.",
            failure: "Sans ferme, ce village reste arriéré."
        }
    },
    {
        id: 'build_cistern',
        type: 'build',
        name: 'Construire une citerne',
        description: 'Cléopâtre veut une citerne',
        building: 'cistern',
        count: [1],
        tier: 2,
        timeLimit: 90,
        reward: 150,
        penalty: 'death',
        messages: {
            start: "Une citerne stockera l'eau du Nil ! Construisez-la !",
            reminder: "L'eau s'évapore ! Il me faut cette citerne !",
            success: "Cette citerne gardera notre eau précieuse.",
            failure: "Sans citerne, l'eau se perd. Comme vous."
        }
    },
    {
        id: 'build_houses_2',
        type: 'build',
        name: 'Construire des maisons',
        description: 'Cléopâtre veut {count} maison(s)',
        building: 'house',
        count: [2, 3],
        tier: 2,
        timeLimit: 120,
        reward: 250,
        penalty: 'death',
        messages: {
            start: "Mon village grandit ! Construisez {count} maison(s) supplémentaires !",
            reminder: "Le temps presse ! Où sont mes maisons ?",
            success: "Excellent travail ! Voici votre récompense.",
            failure: "Vous m'avez déçue pour la dernière fois..."
        }
    },
    {
        id: 'build_granary',
        type: 'build',
        name: 'Construire un grenier',
        description: 'Cléopâtre veut un grenier',
        building: 'granary',
        count: [1],
        tier: 2,
        timeLimit: 100,
        reward: 220,
        penalty: 'death',
        messages: {
            start: "Nous devons stocker notre nourriture ! Construisez un grenier !",
            reminder: "La nourriture pourrit ! Il me faut ce grenier !",
            success: "Excellent ! Notre nourriture sera bien conservée.",
            failure: "Sans stockage, tout sera perdu. Comme vous."
        }
    },
    {
        id: 'build_workshop',
        type: 'build',
        name: 'Construire un atelier',
        description: 'Cléopâtre veut un atelier',
        building: 'workshop',
        count: [1],
        tier: 2,
        timeLimit: 100,
        reward: 240,
        penalty: 'death',
        messages: {
            start: "Un atelier produira des ressources ! Construisez-le !",
            reminder: "Mon atelier ! Où est-il ?",
            success: "Cet atelier sera productif.",
            failure: "Sans atelier, pas de production."
        }
    },
    {
        id: 'gather_stone',
        type: 'gather',
        name: 'Collecter de la pierre',
        description: 'Cléopâtre veut {count} pierre',
        resources: ['stone'],
        count: [15, 25, 35],
        tier: 2,
        timeLimit: 100,
        reward: 100,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "J'ai besoin de {count} {resource} pour mes constructions !",
            reminder: "Où est ma pierre ? Le temps presse !",
            success: "Cette pierre servira à de grands projets.",
            failure: "Pathétique. Même la pierre vous échappe."
        }
    },
    {
        id: 'feed_population',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Avoir {count} nourriture en stock',
        count: [25, 40],
        tier: 2,
        timeLimit: 80,
        reward: 120,
        penalty: 'death',
        messages: {
            start: "Mon peuple a faim ! Assurez {count} de nourriture en stock !",
            reminder: "Les ventres crient famine ! Dépêchez-vous !",
            success: "Le peuple est nourri et vous remercie.",
            failure: "Un peuple affamé ne peut me servir. Vous non plus."
        }
    },

    // ================== TIER 3 - MI-PARTIE (Bâtiments Tier 1 & 2) ==================
    {
        id: 'build_bakery',
        type: 'build',
        name: 'Construire une boulangerie',
        description: 'Cléopâtre veut une boulangerie',
        building: 'bakery',
        count: [1],
        tier: 3,
        timeLimit: 110,
        reward: 280,
        penalty: 'death',
        messages: {
            start: "Mon peuple mérite du bon pain ! Construisez une boulangerie !",
            reminder: "L'odeur du pain doit emplir le village !",
            success: "Le pain chaud nourrira mon peuple. Bien joué.",
            failure: "Sans boulangerie, ce village reste primitif."
        }
    },
    {
        id: 'build_aviary',
        type: 'build',
        name: 'Construire une volière',
        description: 'Cléopâtre veut une volière',
        building: 'aviary',
        count: [1],
        tier: 3,
        timeLimit: 100,
        reward: 220,
        penalty: 'death',
        messages: {
            start: "Je dois pouvoir communiquer avec César ! Construisez une volière !",
            reminder: "Rome attend mes messages ! Faites vite !",
            success: "Parfait ! Mes oiseaux porteront mes messages.",
            failure: "Sans communication, l'Égypte est isolée."
        }
    },
    {
        id: 'build_inn',
        type: 'build',
        name: 'Construire une auberge',
        description: 'Cléopâtre veut {count} auberge(s)',
        building: 'inn',
        count: [1, 2],
        tier: 3,
        timeLimit: 100,
        reward: 220,
        penalty: 'death',
        messages: {
            start: "Les voyageurs ont besoin de repos ! Construisez {count} auberge(s) !",
            reminder: "Les voyageurs attendent ! Vite !",
            success: "Cette auberge attirera des visiteurs.",
            failure: "Sans auberge, personne ne vient."
        }
    },
    {
        id: 'build_lumbermill',
        type: 'build',
        name: 'Construire une scierie',
        description: 'Cléopâtre veut une scierie',
        building: 'lumbermill',
        count: [1],
        tier: 3,
        timeLimit: 110,
        reward: 280,
        penalty: 'death',
        messages: {
            start: "Nous avons besoin de bois en quantité ! Construisez une scierie !",
            reminder: "Le bois est essentiel ! Dépêchez-vous !",
            success: "La scierie fonctionnera pour la gloire de l'Égypte.",
            failure: "Sans bois, rien ne se construit."
        }
    },
    {
        id: 'build_quarry',
        type: 'build',
        name: 'Construire une carrière',
        description: 'Cléopâtre veut une carrière',
        building: 'quarry',
        count: [1],
        tier: 3,
        timeLimit: 120,
        reward: 320,
        penalty: 'death',
        messages: {
            start: "La pierre est le fondement de l'Égypte ! Construisez une carrière !",
            reminder: "Les monuments exigent de la pierre ! Faites vite !",
            success: "Cette carrière fournira la pierre de nos monuments.",
            failure: "Sans carrière, pas de monuments."
        }
    },
    {
        id: 'build_market',
        type: 'build',
        name: 'Construire un marché',
        description: 'Cléopâtre veut un marché',
        building: 'market',
        count: [1],
        tier: 3,
        timeLimit: 140,
        reward: 420,
        penalty: 'death',
        messages: {
            start: "Le commerce enrichit l'Égypte ! Construisez un marché !",
            reminder: "Les marchands attendent ! Faites vite !",
            success: "Le commerce prospère ! Vous méritez votre récompense.",
            failure: "Sans commerce, ce village ne vaut rien."
        }
    },
    {
        id: 'gather_mixed',
        type: 'gather',
        name: 'Collecter des ressources',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand', 'clay'],
        count: [25, 35, 45],
        tier: 3,
        timeLimit: 110,
        reward: 150,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "Mes projets nécessitent {count} {resource}. Rassemblez-les !",
            reminder: "Mes ressources ! Où sont-elles ?",
            success: "Ces ressources serviront mes grands projets.",
            failure: "Incapable de rassembler de simples ressources..."
        }
    },
    {
        id: 'send_message',
        type: 'message',
        name: 'Message à César',
        description: 'Envoyez un message à Rome',
        requiresBuilding: 'aviary',
        tier: 3,
        timeLimit: 50,
        reward: 250,
        penalty: 'death',
        messages: {
            start: "Je dois communiquer avec César ! Envoyez un message à Rome !",
            reminder: "César attend ma réponse ! Faites vite !",
            success: "Le message est parti. César sera content.",
            failure: "Sans communication, l'Égypte est isolée."
        }
    },
    {
        id: 'feed_population_2',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Avoir {count} nourriture en stock',
        count: [60, 80],
        tier: 3,
        timeLimit: 90,
        reward: 160,
        penalty: 'death',
        messages: {
            start: "La population a grandi ! Assurez {count} de nourriture !",
            reminder: "La famine menace ! Plus de nourriture !",
            success: "Le peuple est rassasié. Continuez ainsi.",
            failure: "La famine s'abat sur le village."
        }
    },

    // ================== TIER 4 - PARTIE AVANCÉE (Bâtiments Tier 2) ==================
    {
        id: 'build_villa',
        type: 'build',
        name: 'Construire une villa',
        description: 'Cléopâtre veut {count} villa(s)',
        building: 'villa',
        count: [1, 2],
        tier: 4,
        timeLimit: 150,
        reward: 700,
        penalty: 'death',
        messages: {
            start: "La noblesse mérite des villas ! Construisez-en {count} !",
            reminder: "Mes nobles attendent leurs villas !",
            success: "Ces villas sont dignes de ma cour.",
            failure: "Sans villa, la noblesse me déserte."
        }
    },
    {
        id: 'build_baths',
        type: 'build',
        name: 'Construire des thermes',
        description: 'Cléopâtre veut des thermes',
        building: 'baths',
        count: [1],
        tier: 4,
        timeLimit: 140,
        reward: 580,
        penalty: 'death',
        messages: {
            start: "Mon peuple mérite des bains dignes de ce nom ! Construisez des thermes !",
            reminder: "L'hygiène est primordiale ! Mes thermes !",
            success: "Ces thermes purifieront corps et âme.",
            failure: "Sans thermes, ce village sent mauvais."
        }
    },
    {
        id: 'build_library',
        type: 'build',
        name: 'Construire une bibliothèque',
        description: 'Cléopâtre veut une bibliothèque',
        building: 'library',
        count: [1],
        tier: 4,
        timeLimit: 130,
        reward: 520,
        penalty: 'death',
        messages: {
            start: "Le savoir est précieux ! Construisez une bibliothèque !",
            reminder: "La connaissance m'attend ! Vite !",
            success: "Cette bibliothèque préservera le savoir de l'Égypte.",
            failure: "Sans savoir, ce peuple reste ignorant."
        }
    },
    {
        id: 'build_barracks',
        type: 'build',
        name: 'Construire une caserne',
        description: 'Cléopâtre veut une caserne',
        building: 'barracks',
        count: [1],
        tier: 4,
        timeLimit: 130,
        reward: 480,
        penalty: 'death',
        messages: {
            start: "L'Égypte doit être protégée ! Construisez une caserne !",
            reminder: "Les ennemis menacent ! Où est ma caserne ?",
            success: "Mes soldats protègeront désormais le village.",
            failure: "Sans défense, le village tombera."
        }
    },
    {
        id: 'build_obelisk',
        type: 'build',
        name: 'Ériger un obélisque',
        description: 'Cléopâtre veut un obélisque',
        building: 'obelisk',
        count: [1],
        tier: 4,
        timeLimit: 150,
        reward: 550,
        penalty: 'death',
        messages: {
            start: "Ma gloire doit être visible de loin ! Érigez un obélisque !",
            reminder: "L'obélisque doit pointer vers le ciel ! Vite !",
            success: "Cet obélisque témoigne de ma grandeur.",
            failure: "Sans obélisque, ma gloire reste invisible."
        }
    },
    {
        id: 'build_temple',
        type: 'build',
        name: 'Ériger un temple',
        description: 'Cléopâtre exige un temple',
        building: 'temple',
        count: [1],
        tier: 4,
        timeLimit: 180,
        reward: 750,
        penalty: 'death',
        messages: {
            start: "Je veux un temple glorifiant les dieux et ma magnificence !",
            reminder: "Les dieux s'impatientent, et moi aussi !",
            success: "Ce temple témoigne de votre dévotion.",
            failure: "Sans temple, vous ne méritez pas ma clémence."
        }
    },
    {
        id: 'build_harbor',
        type: 'build',
        name: 'Construire un port',
        description: 'Cléopâtre veut un port',
        building: 'harbor',
        count: [1],
        tier: 4,
        timeLimit: 180,
        reward: 850,
        penalty: 'death',
        messages: {
            start: "Le Nil doit servir notre commerce ! Construisez un port !",
            reminder: "Les navires attendent ! Où est mon port ?",
            success: "Ce port ouvrira l'Égypte au monde.",
            failure: "Sans port, nous sommes isolés du monde."
        }
    },
    {
        id: 'build_gardens',
        type: 'build',
        name: 'Créer des jardins',
        description: 'Cléopâtre veut des jardins suspendus',
        building: 'gardens',
        count: [1],
        tier: 4,
        timeLimit: 150,
        reward: 650,
        penalty: 'death',
        messages: {
            start: "Je veux des jardins dignes de Babylone ! Créez-les !",
            reminder: "Mes jardins ! Où sont-ils ?",
            success: "Ces jardins sont une merveille.",
            failure: "Sans jardins, ce village reste triste."
        }
    },
    {
        id: 'gather_advanced',
        type: 'gather',
        name: 'Collecter des ressources',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand', 'clay'],
        count: [40, 60, 80],
        tier: 4,
        timeLimit: 130,
        reward: 250,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "Mes grands projets nécessitent {count} {resource} !",
            reminder: "Ces ressources sont vitales ! Dépêchez-vous !",
            success: "Excellent ! Ces ressources serviront la grandeur de l'Égypte.",
            failure: "Pathétique. Vous ne méritez pas de servir l'Égypte."
        }
    },
    {
        id: 'feed_population_3',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Avoir {count} nourriture en stock',
        count: [120, 160],
        tier: 4,
        timeLimit: 110,
        reward: 250,
        penalty: 'death',
        messages: {
            start: "Mon empire grandit ! Il faut {count} nourriture !",
            reminder: "La nourriture s'épuise ! Plus vite !",
            success: "L'abondance règne dans mon village.",
            failure: "La disette vous condamne."
        }
    },

    // ================== TIER 5 - FIN DE PARTIE (Bâtiments Tier 3) ==================
    {
        id: 'build_academy',
        type: 'build',
        name: 'Construire une académie',
        description: 'Cléopâtre veut une académie',
        building: 'academy',
        count: [1],
        tier: 5,
        timeLimit: 300,
        reward: 4200,
        penalty: 'death',
        messages: {
            start: "Le savoir suprême exige une académie ! Construisez-la !",
            reminder: "Les savants attendent leur académie !",
            success: "Cette académie formera les plus grands esprits.",
            failure: "Sans académie, l'ignorance triomphe."
        }
    },
    {
        id: 'build_grand_temple',
        type: 'build',
        name: 'Ériger un grand temple',
        description: 'Cléopâtre veut un grand temple',
        building: 'grand_temple',
        count: [1],
        tier: 5,
        timeLimit: 350,
        reward: 5800,
        penalty: 'death',
        messages: {
            start: "Les dieux méritent un grand temple ! Érigez-le !",
            reminder: "Les dieux s'impatientent ! Mon grand temple !",
            success: "Ce grand temple honorera les dieux pour l'éternité.",
            failure: "Sans temple grandiose, les dieux m'abandonnent."
        }
    },
    {
        id: 'build_coliseum',
        type: 'build',
        name: 'Construire un colisée',
        description: 'Cléopâtre veut un colisée',
        building: 'coliseum',
        count: [1],
        tier: 5,
        timeLimit: 400,
        reward: 5200,
        penalty: 'death',
        messages: {
            start: "Le peuple veut du spectacle ! Construisez un colisée !",
            reminder: "Les jeux doivent commencer ! Mon colisée !",
            success: "Ce colisée divertira mon peuple pour des générations.",
            failure: "Sans divertissement, le peuple se révolte."
        }
    },
    {
        id: 'build_pyramid',
        type: 'build',
        name: 'Construire une pyramide',
        description: 'Cléopâtre exige une pyramide monumentale',
        building: 'pyramid',
        count: [1],
        tier: 5,
        timeLimit: 500,
        reward: 3500,
        penalty: 'death',
        messages: {
            start: "Ma gloire doit traverser les âges ! Construisez-moi une pyramide !",
            reminder: "Cette pyramide sera mon éternité ! Ne me décevez pas !",
            success: "Magnifique ! Cette pyramide témoignera de ma grandeur pour l'éternité !",
            failure: "Sans pyramide, vous n'avez aucune valeur."
        }
    },
    {
        id: 'build_sphinx',
        type: 'build',
        name: 'Ériger un sphinx',
        description: 'Cléopâtre veut un sphinx',
        building: 'sphinx',
        count: [1],
        tier: 5,
        timeLimit: 450,
        reward: 6200,
        penalty: 'death',
        messages: {
            start: "Un sphinx gardera mon royaume ! Érigez-le !",
            reminder: "Le sphinx doit veiller ! Dépêchez-vous !",
            success: "Ce sphinx gardera l'Égypte pour l'éternité.",
            failure: "Sans sphinx, mon royaume reste sans gardien."
        }
    },
    {
        id: 'build_palace',
        type: 'build',
        name: 'Construire un palais royal',
        description: 'Cléopâtre exige un palais royal',
        building: 'palace',
        count: [1],
        tier: 5,
        timeLimit: 500,
        reward: 8500,
        penalty: 'death',
        messages: {
            start: "Je mérite un palais digne de ma magnificence ! Construisez-le !",
            reminder: "Mon palais ! La royauté ne peut attendre !",
            success: "Ce palais est digne de la plus grande reine d'Égypte !",
            failure: "Sans palais, je ne peux régner dignement."
        }
    },
    {
        id: 'gather_massive',
        type: 'gather',
        name: 'Collecter des ressources massives',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand'],
        count: [80, 120, 150],
        tier: 5,
        timeLimit: 160,
        reward: 450,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "Les monuments exigent {count} {resource} ! Rassemblez-les immédiatement !",
            reminder: "Les ressources ! Mes monuments les attendent !",
            success: "Ces ressources contribueront à mes monuments éternels.",
            failure: "Vous avez failli devant la tâche ultime."
        }
    },
    {
        id: 'feed_population_4',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Avoir {count} nourriture en stock',
        count: [250, 350],
        tier: 5,
        timeLimit: 140,
        reward: 420,
        penalty: 'death',
        messages: {
            start: "Mon empire est vaste ! Il faut {count} nourriture !",
            reminder: "Le peuple a faim ! Nourrissez-le !",
            success: "Mon peuple prospère sous ma gouvernance.",
            failure: "Un empire affamé s'effondre."
        }
    }
];

// Dialogues aléatoires de Cléopâtre (quand pas de tâche)
const CLEOPATRA_IDLE_MESSAGES = [
    "Je surveille votre travail de près...",
    "L'Égypte doit prospérer sous ma gouvernance.",
    "Les dieux me regardent. Ne me décevez pas.",
    "César m'a envoyé ses salutations. Impressionnez-moi.",
    "Ce village grandira, ou vous périrez.",
    "Je suis patiente... mais pas éternellement.",
    "Le Nil apporte la vie. Apportez-moi des résultats.",
    "Votre destin est entre mes mains, chef de village.",
    "Les pyramides de mes ancêtres me regardent. Soyez digne.",
    "Marc Antoine m'attend. Ne me faites pas perdre mon temps.",
    "Chaque pierre posée est un pas vers la gloire.",
    "Mon royaume sera le plus prospère de tous.",
    "Les étoiles annoncent de grandes choses pour l'Égypte."
];

// Messages de récompense
const REWARD_MESSAGES = [
    "Voici votre récompense. Continuez ainsi.",
    "L'or de l'Égypte coule pour ceux qui me servent bien.",
    "Vous méritez cette récompense. Pour l'instant.",
    "Prenez cet or et utilisez-le sagement."
];

// Configuration de la progression
const DIFFICULTY_CONFIG = {
    // Temps en secondes avant de débloquer chaque tier de tâches
    tierUnlockTimes: {
        1: 0,      // Immédiat
        2: 120,    // 2 minutes
        3: 300,    // 5 minutes
        4: 600,    // 10 minutes
        5: 1200    // 20 minutes
    },
    // Multiplicateur de quantité selon le temps de jeu (bonus par minute)
    resourceMultiplierPerMinute: 0.03, // +3% par minute
    // Quantité max de multiplication
    maxResourceMultiplier: 2.5
};

// Configuration de déblocage des tiers de bâtiments
const BUILDING_TIER_UNLOCK = {
    1: {
        time: 0,           // Immédiat
        name: 'Début de partie',
        icon: '🌱',
        color: '#4ade80'
    },
    2: {
        time: 300,         // 5 minutes
        name: 'Milieu de partie',
        icon: '🏗️',
        color: '#60a5fa'
    },
    3: {
        time: 900,         // 15 minutes
        name: 'Fin de partie',
        icon: '👑',
        color: '#ffd700'
    }
};

export { CLEOPATRA_TASKS, CLEOPATRA_IDLE_MESSAGES, REWARD_MESSAGES, DIFFICULTY_CONFIG, BUILDING_TIER_UNLOCK };
