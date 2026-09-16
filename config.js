window.MATRIX_CONFIG = {
  eventTitle: "THE MATRIX: AFTER DARK",
  displayDate: "SATURDAY, 7 NOVEMBER 2026",
  eventDateISO: "2026-11-07T19:00:00+11:00",
  displayTime: "7:00 PM",
  venue: "BOYLE HQ\nUNIT B4\n2 CURRIE CRES, GRIFFITH ACT",
  dressCode: "MATRIX GRUNGE",
  briefing: [
    "The signal has found you.",
    "You have been selected to join us for one night beyond the simulation.",
    "Step inside a world of green code, black leather and cyberpunk shades.",
    "We’ll plug in for a night of cocktails, music and experiences that blur the line between real and unreal.",
    "<strong>Your mission is simple:</strong><br>Look the part.<br>Follow the white rabbit.<br>Join us inside the Matrix.",
  ],

  // FormSubmit sends the red-pill RSVP to this address without leaving the site.
  // On the first test submission, approve the one-time activation email.
  rsvpEndpoint: "https://formsubmit.co/ajax/steven.cuzzillo@gmail.com",
  rsvpSubjectPrefix: "Matrix After Dark RSVP",

  audio: {
    ringtone: "assets/audio/ringtone.mp3",
    morpheusCall: "assets/audio/morpheus-call.mp3",
    phoneFeed: "assets/audio/phone-feed.mp3",
    backgroundMusic: "assets/audio/background-music.mp3",
    morpheusRedPill: "assets/audio/morpheus-red-pill.mp3",
    bluePill: "assets/audio/blue-pill.mp3"
  },

  volumes: {
    ringtone: 0.9,
    voice: 1.0, // Native source level; no extra gain/compression is applied to Morpheus.
    phoneFeed: 0.40,
    music: 0.36,
    transition: 0.55
  },

  // Audio-independent safety timings. The site always advances even if a file fails.
  timing: {
    openingStartDelay: 900,
    rabbitGlimpseMs: 0,
    callFallbackMs: 6200, // Used only if the audio cannot start or metadata is unavailable.
    phoneFeedInviteFadeMs: 1100, // Fade only after the white flash has revealed the invitation.
    redAudioFallbackMs: 9000,
    blueReturnMs: 7800
  },

  // Add as many entries as you like. Missing images are skipped automatically.
  characters: [
    { name: "NEO", image: "assets/images/characters/neo.jpg", note: "Long black coat, fitted black layers, narrow shades, minimalist cool." },
    { name: "TRINITY", image: "assets/images/characters/trinity.jpg", note: "Glossy black leather, oval shades, slicked-back hair, razor-sharp attitude." },
    { name: "MORPHEUS", image: "assets/images/characters/morpheus.jpg", note: "Long leather coat, sharp tailoring, iconic rimless shades, commanding presence." },
    { name: "AGENT SMITH", image: "assets/images/characters/agent-smith.jpg", note: "Black suit, crisp white shirt, dark tie, severe rectangular shades." },
    { name: "NIOBE", image: "assets/images/characters/niobe.jpg", note: "Structured leather, sleek shades, statement hair, tactical edge." },
    { name: "SERAPH", image: "assets/images/characters/seraph.jpg", note: "Black tank, flowing silky overshirt, round shades, understated cool." },
    { name: "PERSEPHONE", image: "assets/images/characters/persephone.jpg", note: "Blood-red leather, sculpted silhouette, sleek hair, decadent glamour." },
    { name: "THE TWINS", image: "assets/images/characters/twins.jpg", note: "Head-to-toe white, long coats, pale shades, platinum dreadlocks." }
  ]
};
