// ==========================================
// TÂCHES DE CLÉOPÂTRE
// ==========================================

// Tiers de difficulté:
// 1 = Début de partie (0-2 min)
// 2 = Partie précoce (2-5 min)
// 3 = Mi-partie (5-10 min)
// 4 = Partie avancée (10-15 min)
// 5 = Fin de partie (15+ min)

// Tâches que Cléopâtre peut demander
const CLEOPATRA_TASKS = [
    // ================== TIER 1 - DÉBUT ==================
    {
        id: 'build_houses',
        type: 'build',
        name: 'Construire des maisons',
        description: 'Cléopâtre veut que vous construisiez {count} maison(s)',
        building: 'house',
        count: [1, 2],
        tier: 1,
        timeLimit: 120,
        reward: 200,
        penalty: 'death',
        messages: {
            start: "Mon village a besoin de logements. Construisez {count} maison(s) ou subissez ma colère !",
            reminder: "Le temps presse ! Où sont mes maisons ?",
            success: "Excellent travail ! Voici votre récompense.",
            failure: "Vous m'avez déçue pour la dernière fois..."
        }
    },
    {
        id: 'build_field',
        type: 'build',
        name: 'Créer un champ',
        description: 'Cléopâtre veut {count} nouveau(x) champ(s)',
        building: 'field',
        count: [1],
        tier: 1,
        timeLimit: 100,
        reward: 120,
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
        description: 'Cléopâtre demande un puits pour son peuple',
        building: 'well',
        count: [1],
        tier: 1,
        timeLimit: 90,
        reward: 150,
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
        name: 'Collecter des ressources basiques',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['wood', 'dirt'],
        count: [15, 20, 25],
        tier: 1,
        timeLimit: 120,
        reward: 80,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "J'ai besoin de {count} {resource} pour mes projets. Rassemblez-les !",
            reminder: "Où sont mes ressources ? Le temps presse !",
            success: "Ces ressources serviront bien l'Égypte.",
            failure: "Vous ne pouvez même pas collecter quelques ressources..."
        }
    },

    // ================== TIER 2 - PARTIE PRÉCOCE ==================
    {
        id: 'build_houses_2',
        type: 'build',
        name: 'Construire des maisons',
        description: 'Cléopâtre veut que vous construisiez {count} maison(s)',
        building: 'house',
        count: [2, 3],
        tier: 2,
        timeLimit: 150,
        reward: 300,
        penalty: 'death',
        messages: {
            start: "Mon village grandit ! Construisez {count} maison(s) supplémentaires !",
            reminder: "Le temps presse ! Où sont mes maisons ?",
            success: "Excellent travail ! Voici votre récompense.",
            failure: "Vous m'avez déçue pour la dernière fois..."
        }
    },
    {
        id: 'build_field_2',
        type: 'build',
        name: 'Créer des champs',
        description: 'Cléopâtre veut {count} nouveau(x) champ(s)',
        building: 'field',
        count: [2],
        tier: 2,
        timeLimit: 120,
        reward: 180,
        penalty: 'death',
        messages: {
            start: "La population augmente ! Il nous faut {count} champ(s) de plus !",
            reminder: "Les ventres grondent ! Où sont les champs ?",
            success: "La terre donnera ses fruits grâce à vous.",
            failure: "Si mon peuple meurt de faim, vous mourrez aussi."
        }
    },
    {
        id: 'build_granary',
        type: 'build',
        name: 'Construire un grenier',
        description: 'Cléopâtre veut un grenier pour stocker la nourriture',
        building: 'granary',
        count: [1],
        tier: 2,
        timeLimit: 120,
        reward: 250,
        penalty: 'death',
        messages: {
            start: "Nous devons stocker notre nourriture ! Construisez un grenier !",
            reminder: "La nourriture pourrit ! Il me faut ce grenier !",
            success: "Excellent ! Notre nourriture sera bien conservée.",
            failure: "Sans stockage, tout sera perdu. Comme vous."
        }
    },
    {
        id: 'build_aviary',
        type: 'build',
        name: 'Construire une volière',
        description: 'Cléopâtre veut une volière pour communiquer',
        building: 'aviary',
        count: [1],
        tier: 2,
        timeLimit: 100,
        reward: 250,
        penalty: 'death',
        messages: {
            start: "Je dois pouvoir communiquer avec César ! Construisez une volière !",
            reminder: "Rome attend mes messages ! Faites vite !",
            success: "Parfait ! Mes oiseaux porteront mes messages.",
            failure: "Sans communication, l'Égypte est isolée. Tout comme vous."
        }
    },
    {
        id: 'gather_stone',
        type: 'gather',
        name: 'Collecter de la pierre',
        description: 'Cléopâtre veut {count} pierre',
        resources: ['stone'],
        count: [20, 30, 40],
        tier: 2,
        timeLimit: 120,
        reward: 120,
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
        description: 'Assurez-vous d\'avoir {count} nourriture en stock',
        count: [30, 50],
        tier: 2,
        timeLimit: 90,
        reward: 150,
        penalty: 'death',
        messages: {
            start: "Mon peuple a faim ! Assurez {count} de nourriture en stock !",
            reminder: "Les ventres crient famine ! Dépêchez-vous !",
            success: "Le peuple est nourri et vous remercie.",
            failure: "Un peuple affamé ne peut me servir. Vous non plus."
        }
    },

    // ================== TIER 3 - MI-PARTIE ==================
    {
        id: 'build_bakery',
        type: 'build',
        name: 'Construire une boulangerie',
        description: 'Cléopâtre veut une boulangerie',
        building: 'bakery',
        count: [1],
        tier: 3,
        timeLimit: 130,
        reward: 350,
        penalty: 'death',
        messages: {
            start: "Mon peuple mérite du bon pain ! Construisez une boulangerie !",
            reminder: "L'odeur du pain doit emplir le village !",
            success: "Le pain chaud nourrira mon peuple. Bien joué.",
            failure: "Sans boulangerie, ce village reste primitif. Comme vous."
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
        timeLimit: 120,
        reward: 300,
        penalty: 'death',
        messages: {
            start: "Nous avons besoin de bois en quantité ! Construisez une scierie !",
            reminder: "Le bois est essentiel ! Dépêchez-vous !",
            success: "La scierie fonctionnera pour la gloire de l'Égypte.",
            failure: "Sans bois, rien ne se construit. Votre fin non plus."
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
        timeLimit: 130,
        reward: 350,
        penalty: 'death',
        messages: {
            start: "La pierre est le fondement de l'Égypte ! Construisez une carrière !",
            reminder: "Les monuments exigent de la pierre ! Faites vite !",
            success: "Cette carrière fournira la pierre de nos monuments.",
            failure: "Sans carrière, pas de monuments. Pas de gloire pour vous."
        }
    },
    {
        id: 'build_market',
        type: 'build',
        name: 'Construire un marché',
        description: 'Cléopâtre veut stimuler le commerce',
        building: 'market',
        count: [1],
        tier: 3,
        timeLimit: 150,
        reward: 500,
        penalty: 'death',
        messages: {
            start: "Le commerce enrichit l'Égypte ! Construisez un marché !",
            reminder: "Les marchands attendent ! Faites vite !",
            success: "Le commerce prospère ! Vous méritez votre récompense.",
            failure: "Sans commerce, ce village ne vaut rien. Ni vous."
        }
    },
    {
        id: 'gather_mixed',
        type: 'gather',
        name: 'Collecter des ressources',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand', 'clay'],
        count: [30, 40, 50],
        tier: 3,
        timeLimit: 120,
        reward: 180,
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
        name: 'Envoyer un message à César',
        description: 'Utilisez la volière pour envoyer un message à Rome',
        requiresBuilding: 'aviary',
        tier: 3,
        timeLimit: 60,
        reward: 300,
        penalty: 'death',
        messages: {
            start: "Je dois communiquer avec César ! Envoyez un message à Rome !",
            reminder: "César attend ma réponse ! Faites vite !",
            success: "Le message est parti. César sera content... ou pas.",
            failure: "Sans communication, l'Égypte est isolée. Tout comme vous, désormais."
        }
    },
    {
        id: 'feed_population_2',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Assurez-vous d\'avoir {count} nourriture en stock',
        count: [80, 100],
        tier: 3,
        timeLimit: 100,
        reward: 200,
        penalty: 'death',
        messages: {
            start: "La population a grandi ! Assurez {count} de nourriture !",
            reminder: "La famine menace ! Plus de nourriture !",
            success: "Le peuple est rassasié. Continuez ainsi.",
            failure: "La famine s'abat sur le village. Et sur vous."
        }
    },

    // ================== TIER 4 - PARTIE AVANCÉE ==================
    {
        id: 'build_barracks',
        type: 'build',
        name: 'Construire une caserne',
        description: 'Cléopâtre veut une caserne',
        building: 'barracks',
        count: [1],
        tier: 4,
        timeLimit: 140,
        reward: 500,
        penalty: 'death',
        messages: {
            start: "L'Égypte doit être protégée ! Construisez une caserne !",
            reminder: "Les ennemis menacent ! Où est ma caserne ?",
            success: "Mes soldats protègeront désormais le village.",
            failure: "Sans défense, le village tombera. Vous aussi."
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
        timeLimit: 160,
        reward: 600,
        penalty: 'death',
        messages: {
            start: "Ma gloire doit être visible de loin ! Érigez un obélisque !",
            reminder: "L'obélisque doit pointer vers le ciel ! Vite !",
            success: "Cet obélisque témoigne de ma grandeur.",
            failure: "Sans obélisque, ma gloire reste invisible. Comme votre avenir."
        }
    },
    {
        id: 'build_temple',
        type: 'build',
        name: 'Ériger un temple',
        description: 'Cléopâtre exige un temple en son honneur',
        building: 'temple',
        count: [1],
        tier: 4,
        timeLimit: 200,
        reward: 800,
        penalty: 'death',
        messages: {
            start: "Je veux un temple glorifiant les dieux et ma magnificence !",
            reminder: "Les dieux s'impatientent, et moi aussi !",
            success: "Ce temple témoigne de votre dévotion. Vous êtes récompensé.",
            failure: "Sans temple, vous ne méritez pas ma clémence."
        }
    },
    {
        id: 'gather_advanced',
        type: 'gather',
        name: 'Collecter des ressources précieuses',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand', 'clay'],
        count: [50, 70, 100],
        tier: 4,
        timeLimit: 150,
        reward: 300,
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
        description: 'Assurez-vous d\'avoir {count} nourriture en stock',
        count: [150, 200],
        tier: 4,
        timeLimit: 120,
        reward: 300,
        penalty: 'death',
        messages: {
            start: "Mon empire grandit ! Il faut {count} nourriture !",
            reminder: "La nourriture s'épuise ! Plus vite !",
            success: "L'abondance règne dans mon village.",
            failure: "La disette vous condamne autant que le village."
        }
    },

    // ================== TIER 5 - FIN DE PARTIE ==================
    {
        id: 'build_pyramid',
        type: 'build',
        name: 'Construire la pyramide',
        description: 'Cléopâtre exige une pyramide monumentale',
        building: 'pyramid',
        count: [1],
        tier: 5,
        timeLimit: 600, // 10 minutes
        reward: 5000,
        penalty: 'death',
        messages: {
            start: "Ma gloire doit traverser les âges ! Construisez-moi une pyramide !",
            reminder: "Cette pyramide sera mon éternité ! Ne me décevez pas !",
            success: "Magnifique ! Cette pyramide témoignera de ma grandeur pour l'éternité !",
            failure: "Sans pyramide, vous n'avez aucune valeur à mes yeux."
        }
    },
    {
        id: 'gather_massive',
        type: 'gather',
        name: 'Collecter des ressources massives',
        description: 'Cléopâtre veut {count} {resource}',
        resources: ['stone', 'sand'],
        count: [100, 150, 200],
        tier: 5,
        timeLimit: 180,
        reward: 500,
        consumeResources: true,
        penalty: 'death',
        messages: {
            start: "La pyramide exige {count} {resource} ! Rassemblez-les immédiatement !",
            reminder: "Les ressources ! Ma pyramide les attend !",
            success: "Ces ressources contribueront à mon monument éternel.",
            failure: "Vous avez failli devant la tâche ultime."
        }
    },
    {
        id: 'feed_population_4',
        type: 'feed',
        name: 'Nourrir le peuple',
        description: 'Assurez-vous d\'avoir {count} nourriture en stock',
        count: [300, 400],
        tier: 5,
        timeLimit: 150,
        reward: 500,
        penalty: 'death',
        messages: {
            start: "Mon empire est vaste ! Il faut {count} nourriture !",
            reminder: "Le peuple a faim ! Nourrissez-le !",
            success: "Mon peuple prospère sous ma gouvernance.",
            failure: "Un empire affamé s'effondre. Vous avec."
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
    "Marc Antoine m'attend. Ne me faites pas perdre mon temps."
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
    // Temps en secondes avant de débloquer chaque tier
    tierUnlockTimes: {
        1: 0,      // Immédiat
        2: 120,    // 2 minutes
        3: 300,    // 5 minutes
        4: 600,    // 10 minutes
        5: 900     // 15 minutes
    },
    // Multiplicateur de quantité selon le temps de jeu (bonus par minute)
    resourceMultiplierPerMinute: 0.05, // +5% par minute
    // Quantité max de multiplication
    maxResourceMultiplier: 3.0
};

export { CLEOPATRA_TASKS, CLEOPATRA_IDLE_MESSAGES, REWARD_MESSAGES, DIFFICULTY_CONFIG };
