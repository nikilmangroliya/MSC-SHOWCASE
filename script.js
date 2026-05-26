if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Optimization: Lenis Smooth Scroll Synchronized with GSAP
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true
});
lenis.scrollTo(0, { immediate: true });

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.clearScrollMemory("manual");
lenis.on('scroll', ScrollTrigger.update);

window.addEventListener('load', () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });
    ScrollTrigger.refresh();
  }, 50);
});

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// --- 1. Browser State & Visibility Handlers ---
// Pauses GSAP timelines & Smooth Scrolling when the tab is hidden to save battery & CPU
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.ticker.sleep();
    lenis.stop();
  } else {
    gsap.ticker.wake();
    lenis.start();
  }
});

// --- 2. Visual & Viewport Handlers ---
// Uses modern ResizeObserver to refresh ScrollTrigger layout changes
let resizeTimer;
const resizeObserver = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});
resizeObserver.observe(document.body);

// --- 3. Hardware & Environmental Handlers ---
// Syncs JavaScript execution with the user's OS-level Reduced Motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (prefersReducedMotion.matches) {
  gsap.globalTimeline.timeScale(1000); // Instantly finish all animations
  lenis.destroy(); // Disable interpolated smooth scrolling
}

// --- 4. Input & Interaction Handlers ---
// Optimizes the browser's main thread by enforcing passive touch and wheel interactions
document.addEventListener('touchstart', function () { }, { passive: true });
document.addEventListener('wheel', function () { }, { passive: true });

const menuToggle = document.getElementById('menu-toggle');
const fullscreenMenu = document.getElementById('fullscreen-menu');

menuToggle.addEventListener('click', () => {
  fullscreenMenu.classList.toggle('active');
  menuToggle.classList.toggle('open');
});

window.smoothRefresh = function () {
  gsap.to("main", {
    opacity: 0, scale: 0.95, y: "2vh", duration: 0.4, ease: "power2.inOut",
    onComplete: () => {
      window.scrollTo(0, 0);
      window.location.reload();
    }
  });
};

let animationCtx; // Global GSAP Context for precise garbage collection

function initPageAnimations() {
  // Initialize GSAP context scoped to the main wrapper
  animationCtx = gsap.context(() => {
    // Accessibility: Bail out of complex animations if user prefers reduced motion
    if (prefersReducedMotion.matches) return;

    // Auto-parse legacy WOW elements into modern, buttery GSAP ScrollTriggers
    const wowElements = document.querySelectorAll('.wow');
    wowElements.forEach(el => {
      let x = 0, y = 0;
      if (el.classList.contains('fadeInLeft')) x = -50;
      else if (el.classList.contains('fadeInRight')) x = 50;
      else if (el.classList.contains('fadeInUp')) y = 50;

      let dur = parseFloat(el.getAttribute('data-wow-duration')) || 1;
      let del = parseFloat(el.getAttribute('data-wow-delay')) || 0;

      gsap.fromTo(el,
        { opacity: 0, x: x, y: y },
        { opacity: 1, x: 0, y: 0, duration: dur, delay: del, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" } }
      );
    });

    // Utility to split text into characters for sequential animation
    const splitText = (selector) => {
      const chars = [];
      document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.split) return;
        const text = el.innerText;
        el.innerHTML = '';

        const fragment = document.createDocumentFragment();
        [...text].forEach(char => {
          const span = document.createElement('span');
          span.innerHTML = char === ' ' ? '&nbsp;' : char;
          span.style.display = char === ' ' ? 'inline' : 'inline-block';
          span.style.willChange = 'opacity, transform';
          fragment.appendChild(span);
          if (char !== ' ') chars.push(span);
        });

        el.appendChild(fragment);
        el.dataset.split = "true";
      });
      return chars;
    };

    let mm = gsap.matchMedia();

    // Desktop animations (769px+)
    mm.add("(min-width: 769px)", () => {
      const heroSubChars = splitText(".hero-subtitle");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1
        }
      });

      tl.to(".hero-image", { scale: 1.5, y: "10vh", ease: "none" }, 0);

      tl.fromTo(heroSubChars,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.05, ease: "power2.out" },
        0);

      gsap.to(".hero-text-group:not(.front-text)", { scale: 0.8, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    });

    // Tablet animations (481px - 768px)
    mm.add("(min-width: 481px) and (max-width: 768px)", () => {
      gsap.to(".hero-image", {
        scale: 1.3, y: "5vh", ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to(".hero-text-group:not(.front-text)", {
        scale: 0.9, opacity: 0, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    });

    // Mobile animations (up to 480px)
    mm.add("(max-width: 480px)", () => {
      gsap.to(".hero-image", {
        scale: 1.2, y: "3vh", ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to(".hero-text-group:not(.front-text)", {
        scale: 0.9, opacity: 0, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "80% top", scrub: true }
      });
    });

  }, document.querySelector("main"));
}


// --- 5. Music Player Logic ---
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
window.isPlaying = false;

musicBtn.addEventListener('click', () => {
  const icon = musicBtn.querySelector('i');
  if (window.isPlaying) {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
    icon.className = 'fas fa-music';
  } else {
    bgMusic.play();
    musicBtn.classList.add('playing');
    icon.className = 'fas fa-pause';
  }
  window.isPlaying = !window.isPlaying;
});

initPageAnimations();



// ================================================================
// ALBUM SCROLL SHOWCASE —  Smooth Side-to-Front Rotation
// ================================================================
function initAlbumShowcase() {
  const showcase = document.querySelector('.album-showcase');
  const pinned = document.querySelector('.album-showcase-pinned');
  const album = document.getElementById('album-featured');
  const ring = document.getElementById('album-ring');
  const textLeft = document.getElementById('bg-text-left');
  const textRight = document.getElementById('bg-text-right');
  if (!showcase || !album) return;

  // Dictionary of album details based on image filename
  const albumData = {
    "album1.webp": {
      title: "83",
      artist: "SRK",
      listens: "83M",
      desc: "A custom retro-themed auditory masterpiece designed specifically to celebrate personal creative milestones. Rich, pulsing synth waves blend seamlessly with dynamic basslines to create a highly addictive nostalgic vibe.",
      spotify: "https://open.spotify.com/search/83",
      apple: "https://music.apple.com/us/search?term=83",
      youtube: "https://www.youtube.com/results?search_query=83+song",
      soundcloud: "#",
      instagram: "#",
      audio: "assets/album1.mp3"
    },
    "album2.webp": {
      title: "PARCHAI",
      artist: "KASM",
      listens: "830K",
      desc: "\"Parchai\" is a beautiful track dedicated to THAT ONE GIRL. The song captures the feeling of being in love, where her thoughts and presence linger around like a comforting shadow. Every beat resonates with deep affection and admiration for her.",
      spotify: "https://open.spotify.com/search/Parchai",
      apple: "https://music.apple.com/us/search?term=Parchai",
      youtube: "https://www.youtube.com/results?search_query=Parchai+song",
      soundcloud: "#",
      instagram: "#",
      audio: "assets/album2.mp3"
    },
    "album3.webp": {
      title: "SAHIBA",
      artist: "JASLEEN ROYAL",
      listens: "8.3M",
      desc: "A mesmerizing and soulful melody that captures the profound essence of love, longing, and devotion. \"Sahiba\" weaves a tale of romance that resonates deeply with the heart, wrapped in a beautiful acoustic arrangement.",
      spotify: "https://open.spotify.com/search/Sahiba%20Jasleen%20Royal",
      apple: "https://music.apple.com/us/search?term=Sahiba%20Jasleen%20Royal",
      youtube: "https://www.youtube.com/results?search_query=Sahiba+Jasleen+Royal",
      soundcloud: "#",
      instagram: "https://www.instagram.com/jasleenroyal",
      audio: "assets/album3.mp3"
    },
    "album4.webp": {
      title: "KASHISH",
      artist: "INDIE",
      listens: "830K",
      desc: "An intense exploration of human feelings and the undeniable attraction between two souls. Blending raw lyrics with atmospheric beats to create a deeply moving musical experience.",
      spotify: "https://open.spotify.com/search/Kashish",
      apple: "https://music.apple.com/us/search?term=Kashish",
      youtube: "https://www.youtube.com/results?search_query=Kashish+song",
      soundcloud: "#",
      instagram: "#",
      audio: "assets/album4.mp3"
    },
    "album5.webp": {
      title: "KYA CHAHIYE",
      artist: "AUR",
      listens: "83M",
      desc: "A beautiful expression of unadulterated romance. \"Kya Chahiye\" captures the feeling of wanting nothing more than the presence of the one you love, brought to life by soul-stirring vocals and soothing music.",
      spotify: "https://open.spotify.com/search/Kya%20Chahiye%20Arijit%20Singh",
      apple: "https://music.apple.com/us/search?term=Kya%20Chahiye%20Arijit%20Singh",
      youtube: "https://www.youtube.com/results?search_query=Kya+Chahiye+Arijit+Singh",
      soundcloud: "#",
      instagram: "https://www.instagram.com/arijitsingh",
      audio: "assets/album5.mp3"
    },
    "album6.webp": {
      title: "MAHIYE JINNA SOHNA",
      artist: "DARSHAN RAVAL",
      listens: "83M",
      desc: "A delightful romantic ballad by Darshan Raval that captures the sweet emotions of love, companionship, and effortless warmth. Modern acoustic styling matched with soothing lyrics.",
      spotify: "https://open.spotify.com/search/Mahiye%20Jinna%20Sohna%20Darshan%20Raval",
      apple: "https://music.apple.com/us/search?term=Mahiye%20Jinna%20Sohna%20Darshan%20Raval",
      youtube: "https://www.youtube.com/results?search_query=Mahiye+Jinna+Sohna+Darshan+Raval",
      soundcloud: "#",
      instagram: "https://www.instagram.com/darshanravaldz",
      audio: "assets/album6.mp3"
    },
    "album7.webp": {
      title: "JAB BHI TERI YAD AAYEGI",
      artist: "Harrykahanhai",
      listens: "83M",
      desc: "A heartfelt song of separation, nostalgia, and everlasting memories. Stebin Ben's soulful vocals perfectly paint the sorrow of longing and deep love.",
      spotify: "https://open.spotify.com/search/Jab%20Bhi%20Teri%20Yaad%20Aayegi",
      apple: "https://music.apple.com/us/search?term=Jab%20Bhi%20Teri%20Yaad%20Aayegi",
      youtube: "https://www.youtube.com/results?search_query=Jab+Bhi+Teri+Yaad+Aayegi",
      soundcloud: "#",
      instagram: "https://www.instagram.com/stebinben",
      audio: "assets/album7.mp3"
    },
    "album8.webp": {
      title: "RABBA",
      artist: "MOHIT CHAUHAN",
      listens: "76M",
      desc: "A passionate track loaded with emotional depth, seeking answers from the almighty about love, destiny, and companionship. It combines Mohit's classic rustic tone with powerful chords.",
      spotify: "https://open.spotify.com/search/Rabba%20Mohit%20Chauhan",
      apple: "https://music.apple.com/us/search?term=Rabba%20Mohit%20Chauhan",
      youtube: "https://www.youtube.com/results?search_query=Rabba+Mohit+Chauhan+song",
      soundcloud: "#",
      instagram: "#",
      audio: "assets/album8.mp3"
    },
    "album9.webp": {
      title: "TERI AANKHON MEIN",
      artist: "DARSHAN RAVAL & NEHA KAKKAR",
      listens: "120M",
      desc: "A magical pop-romantic duet that tells a sweet story of eyes lock, instant sparks, and the beginning of a fresh love saga. Lively beats make it an absolute crowd favorite.",
      spotify: "https://open.spotify.com/search/Teri%20Aankhon%20Mein%20Darshan%20Raval",
      apple: "https://music.apple.com/us/search?term=Teri%20Aankhon%20Mein%20Darshan%20Raval",
      youtube: "https://www.youtube.com/results?search_query=Teri+Aankhon+Mein+Darshan+Raval",
      soundcloud: "#",
      instagram: "https://www.instagram.com/nehakakkar",
      audio: "assets/album9.mp3"
    },
    "album10.webp": {
      title: "RAMO RE",
      artist: "JIGARDEN",
      listens: "15M",
      desc: "A high-octane energetic folk-fusion track filled with heavy traditional beats, celebratory Gujarati vibes, and powerful ethnic vocals by Aditya Gadhvi.",
      spotify: "https://open.spotify.com/search/Ramo%20Re%20Aditya%20Gadhvi",
      apple: "https://music.apple.com/us/search?term=Ramo%20Re%20Aditya%20Gadhvi",
      youtube: "https://www.youtube.com/results?search_query=Ramo+Re+Aditya+Gadhvi",
      soundcloud: "#",
      instagram: "https://www.instagram.com/adityagadhviofficial",
      audio: "assets/album10.mp3"
    },
    "album11.webp": {
      title: "CHITTA",
      artist: "MANAN BHARDWAJ",
      listens: "830M",
      desc: "A popular upbeat Punjabi track loaded with modern trap rhythms, energetic basslines, and catchy, infectious hooks designed to get you grooving instantly.",
      spotify: "https://open.spotify.com/search/Chitta%20Tej%20Gill",
      apple: "https://music.apple.com/us/search?term=Chitta%20Tej%20Gill",
      youtube: "https://www.youtube.com/results?search_query=Chitta+Tej+Gill+song",
      soundcloud: "#",
      instagram: "https://www.instagram.com/tejgillmusic",
      audio: "assets/album11.mp3"
    },

    "album12.webp": {
      title: "AFSANEY",
      artist: "YOUNG STUNNERS",
      listens: "50M",
      desc: "A gorgeous, melodic rap masterpiece by the Young Stunners. Talha Anjum and Talha Yunus paint vivid stories of life, success, and loss over a melancholic, soul-stirring beat.",
      spotify: "https://open.spotify.com/search/Afsanay%20Young%20Stunners",
      apple: "https://music.apple.com/us/search?term=Afsanay%20Young%20Stunners",
      youtube: "https://www.youtube.com/results?search_query=Afsanay+Young+Stunners",
      soundcloud: "#",
      instagram: "https://www.instagram.com/youngstunnersofficial",
      audio: "assets/album12.mp3"
    },
    "album13.webp": {
      title: "WARNING",
      artist: "MASSOM",
      listens: "2.1B",
      desc: "Kendrick Lamar's multi-platinum hit. An ironic reminder to others to 'be humble' while Lamar delivers high-powered braggadocio over a heavy, raw Mike Will Made-It piano loop.",
      spotify: "https://open.spotify.com/search/Humble%20Kendrick%20Lamar",
      apple: "https://music.apple.com/us/search?term=Humble%20Kendrick%20Lamar",
      youtube: "https://www.youtube.com/results?search_query=Humble+Kendrick+Lamar",
      soundcloud: "#",
      instagram: "https://www.instagram.com/kendricklamar",
      audio: "assets/album13.mp3"
    },
    "album14.webp": {
      title: "I GUESS",
      artist: "KR$NA",
      listens: "1.4B",
      desc: "A rapid-fire vocal showcase where Eminem fires off syllables at a record-breaking speed. The track stands as a testament to his absolute lyrical dominance and technical arrogance.",
      spotify: "https://open.spotify.com/search/Godzilla%20Eminem",
      apple: "https://music.apple.com/us/search?term=Godzilla%20Eminem",
      youtube: "https://www.youtube.com/results?search_query=Godzilla+Eminem",
      soundcloud: "#",
      instagram: "https://www.instagram.com/eminem",
      audio: "assets/album14.mp3"
    },
    "album15.webp": {
      title: "MAHAAN",
      artist: "ROCKSUN",
      listens: "32M",
      desc: "Pure braggadocio hip-hop. KR$NA glides over a drill beat with intricate rhyme schemes, demonstrating why he resides at the top of the lyrical hierarchy with 'no cap' or lies.",
      spotify: "https://open.spotify.com/search/No%20Cap%20Krsna",
      apple: "https://music.apple.com/us/search?term=No%20Cap%20Krsna",
      youtube: "https://www.youtube.com/results?search_query=No+Cap+Krsna",
      soundcloud: "#",
      instagram: "https://www.instagram.com/realkrsna",
      audio: "assets/album15.mp3"
    },
    "album16.webp": {
      title: "ABOUT ME",
      artist: "DIVINE",
      listens: "70M",
      desc: "Divine lays down his journey from the streets to global stardom in this hard-hitting bar-heavy track. It represents the pride, hard work, and raw street arrogance of the Gilly Goat.",
      spotify: "https://open.spotify.com/search/3%3A59%20AM%20Divine",
      apple: "https://music.apple.com/us/search?term=3%3A59%20AM%20Divine",
      youtube: "https://www.youtube.com/results?search_query=3%3A59+AM+Divine",
      soundcloud: "#",
      instagram: "https://www.instagram.com/viviandivine",
      audio: "assets/album16.mp3"
    },
    "album17.webp": {
      title: "SYSTEM PE SYSTEM",
      artist: "MAAN",
      listens: "18M",
      desc: "A powerful combination of trap rhythms and rapid flows. KR$NA and Karma drop prayer-like bars loaded with top-tier pride, confidence, and lyrical dominance.",
      spotify: "https://open.spotify.com/search/Prathna%20Krsna",
      apple: "https://music.apple.com/us/search?term=Prathna%20Krsna",
      youtube: "https://www.youtube.com/results?search_query=Prathna+Krsna",
      soundcloud: "#",
      instagram: "https://www.instagram.com/realkrsna",
      audio: "assets/album17.mp3"
    },


    "gujarati_main.webp": {
      title: "DWARIKA NO NATH",
      artist: "KRISHNA",
      listens: "15M",
      desc: "An explosive energetic Gujarati folk-fusion masterpiece by Aditya Gadhvi. Heavy traditional dhol beats paired with rich cultural vocals that celebrate the spirit of Gujarat.",
      spotify: "https://open.spotify.com/search/Ramo%20Re%20Aditya%20Gadhvi",
      apple: "https://music.apple.com/us/search?term=Ramo%20Re%20Aditya%20Gadhvi",
      youtube: "https://www.youtube.com/results?search_query=Ramo+Re+Aditya+Gadhvi",
      soundcloud: "#",
      instagram: "https://www.instagram.com/adityagadhviofficial",
      audio: "assets/gujarati_main.mp3"
    },
    "gujarati1.webp": {
      title: "MELE THI",
      artist: "LOCAL",
      listens: "120M",
      desc: "The global sensation that captured hearts everywhere. A high-octane story of a sailor's journey, packed with energetic beats and Aditya's powerhouse vocals.",
      spotify: "https://open.spotify.com/search/Khalasi%20Aditya%20Gadhvi",
      apple: "https://music.apple.com/us/search?term=Khalasi%20Aditya%20Gadhvi",
      youtube: "https://www.youtube.com/results?search_query=Khalasi+Aditya+Gadhvi",
      soundcloud: "#",
      instagram: "https://www.instagram.com/adityagadhviofficial",
      audio: "assets/gujarati1.mp3"
    },
    "gujarati2.webp": {
      title: "MANDA NAMEET",
      artist: "TRIVEDI",
      listens: "45M",
      desc: "A highly soulful, high-energy modern Garba anthem that perfectly blends traditional devotion with contemporary acoustic and pop rhythms.",
      spotify: "https://open.spotify.com/search/Radha%20Ne%20Shyam%20Sachin%20Jigar",
      apple: "https://music.apple.com/us/search?term=Radha%20Ne%20Shyam%20Sachin%20Jigar",
      youtube: "https://www.youtube.com/results?search_query=Radha+Ne+Shyam+Sachin+Jigar",
      soundcloud: "#",
      instagram: "https://www.instagram.com/sachinjigar",
      audio: "assets/gujarati2.mp3"
    },
    "gujarati3.webp": {
      title: "MARU MAN MOHI GAYU",
      artist: "MEET PATEL",
      listens: "60M",
      desc: "The ultimate romantic Gujarati ballad. Jigra's soothing vocals over a beautiful string arrangement make this an unforgettable modern classic.",
      spotify: "https://open.spotify.com/search/Valam%20Aavo%20Ne",
      apple: "https://music.apple.com/us/search?term=Valam%20Aavo%20Ne",
      youtube: "https://www.youtube.com/results?search_query=Valam+Aavo+Ne",
      soundcloud: "#",
      instagram: "https://www.instagram.com/jigardangadhviofficial",
      audio: "assets/gujarati3.mp3"
    },
    "gujarati4.webp": {
      title: "MISRI",
      artist: "I DONT KNOW",
      listens: "12M",
      desc: "A soulful folk ballad echoing the rustic winds and historic landscapes of Kutch, beautifully sung with deep emotion.",
      spotify: "https://open.spotify.com/search/Geli%20Mekhi%20Aditya%20Gadhvi",
      apple: "https://music.apple.com/us/search?term=Geli%20Mekhi%20Aditya%20Gadhvi",
      youtube: "https://www.youtube.com/results?search_query=Geli+Mekhi+Aditya+Gadhvi",
      soundcloud: "#",
      instagram: "https://www.instagram.com/adityagadhviofficial",
      audio: "assets/gujarati4.mp3"
    },
    "default": {
      title: "UNKNOWN TRACK",
      artist: "UNKNOWN ARTIST",
      listens: "-",
      desc: "Details for this track are currently unavailable. Stay tuned for updates.",
      spotify: "#",
      apple: "#",
      youtube: "#",
      soundcloud: "#",
      instagram: "#"
    }
  };

  const albumAudioPlayer = document.getElementById('album-audio-player');
  const panelPlayBtn = document.getElementById('panel-play-btn');
  const frontPlayIcon = document.getElementById('front-play-icon');
  const frontPlayWrapper = document.getElementById('front-play-wrapper');
  const frontPlayText = document.getElementById('front-play-text');

  let currentAlbumAudio = "";

  const syncPlayButtons = () => {
    if (albumAudioPlayer && !albumAudioPlayer.paused) {
      if (panelPlayBtn) {
        panelPlayBtn.classList.add('playing');
        panelPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }
      document.querySelectorAll('.album-featured-art').forEach(albumCard => {
        const fPlayIcon = albumCard.querySelector('.album-play-icon');
        const fPlayText = albumCard.querySelector('.album-play-text');
        const img = albumCard.querySelector('img');
        if (img) {
          const src = img.getAttribute('src');
          const filename = src.split('/').pop();
          const data = albumData[filename] || albumData['default'];
          if (currentAlbumAudio && currentAlbumAudio.includes(data.audio)) {
            if (fPlayIcon) fPlayIcon.innerHTML = '<i class="fas fa-pause" style="margin-left: 0;"></i>';
            if (fPlayText) fPlayText.innerText = 'PAUSE';
          } else {
            if (fPlayIcon) fPlayIcon.innerHTML = '<i class="fas fa-play" style="margin-left: 3px;"></i>';
            if (fPlayText) fPlayText.innerText = 'PLAY';
          }
        }
      });
      document.querySelectorAll('.mini-album-3d').forEach(albumNode => {
        const btn = albumNode.querySelector('.mini-play-btn');
        if (!btn) return;
        const img = albumNode.querySelector('.book-front img');
        if (!img) return;
        const src = img.getAttribute('src');
        const filename = src.split('/').pop();
        const data = albumData[filename] || albumData['default'];
        if (currentAlbumAudio && currentAlbumAudio.includes(data.audio)) {
          btn.classList.add('playing-state');
          btn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        } else {
          btn.classList.remove('playing-state');
          btn.innerHTML = '<i class="fas fa-play"></i> PLAY';
        }
      });
    } else {
      if (panelPlayBtn) {
        panelPlayBtn.classList.remove('playing');
        panelPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
      document.querySelectorAll('.album-featured-art').forEach(albumCard => {
        const fPlayIcon = albumCard.querySelector('.album-play-icon');
        const fPlayText = albumCard.querySelector('.album-play-text');
        if (fPlayIcon) fPlayIcon.innerHTML = '<i class="fas fa-play" style="margin-left: 3px;"></i>';
        if (fPlayText) fPlayText.innerText = 'PLAY';
      });
      document.querySelectorAll('.mini-play-btn').forEach(btn => {
        btn.classList.remove('playing-state');
        btn.innerHTML = '<i class="fas fa-play"></i> PLAY';
      });
    }
  };

  if (albumAudioPlayer) {
    albumAudioPlayer.addEventListener('play', syncPlayButtons);
    albumAudioPlayer.addEventListener('pause', syncPlayButtons);
    albumAudioPlayer.addEventListener('ended', syncPlayButtons);
  }

  // Loop through all showcases (Rhythm & Melody sections)
  document.querySelectorAll('.album-showcase').forEach((showcase) => {
    const pinned = showcase.querySelector('.album-showcase-pinned');
    const album = showcase.querySelector('.album-featured');
    const ring = showcase.querySelector('.album-ring') || document.getElementById('album-ring');
    const textLeft = showcase.querySelector('.bg-text-left');
    const textRight = showcase.querySelector('.bg-text-right');
    if (!pinned || !album) return;

    // Pin the section and create a smooth scrubbed timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: showcase,
        start: 'top top',
        end: 'bottom bottom',
        pin: pinned,
        scrub: 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          if (albumAudioPlayer) {
            const img = album.querySelector('.book-front img');
            if (img) {
              const src = img.getAttribute('src');
              const filename = src.split('/').pop();
              const data = albumData[filename] || albumData['default'];
              const audio = data.audio || "";
              if (audio && (!albumAudioPlayer.src || !albumAudioPlayer.src.includes(audio))) {
                albumAudioPlayer.src = audio;
                currentAlbumAudio = audio;
                albumAudioPlayer.load();
              }
            }
          }
        },
        onEnterBack: () => {
          if (albumAudioPlayer) {
            const img = album.querySelector('.book-front img');
            if (img) {
              const src = img.getAttribute('src');
              const filename = src.split('/').pop();
              const data = albumData[filename] || albumData['default'];
              const audio = data.audio || "";
              if (audio && (!albumAudioPlayer.src || !albumAudioPlayer.src.includes(audio))) {
                albumAudioPlayer.src = audio;
                currentAlbumAudio = audio;
                albumAudioPlayer.load();
              }
            }
          }
        },
        onLeave: () => {
        },
        onLeaveBack: () => {
          if (albumAudioPlayer && !albumAudioPlayer.paused) {
            albumAudioPlayer.pause();
            albumAudioPlayer.currentTime = 0;
          }
        }
      }
    });

    // Background text scrolling
    if (textLeft && textRight) {
      tl.fromTo(textLeft, { x: '-40vw' }, { x: '90vw', duration: 1, ease: 'none' }, 0);
      tl.fromTo(textRight, { x: '40vw' }, { x: '-90vw', duration: 1, ease: 'none' }, 0);
    }

    // Phase 1: Ring fades in and expands
    if (ring) {
      tl.fromTo(ring,
        { opacity: 0, scale: 0.2 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'sine.out' }, 0
      );
    }

    // Phase 2: Album is always visible, starts from dramatic user angle
    tl.fromTo(album,
      { scale: 0.4, rotateY: -360, rotateX: -90 },
      { scale: 0.4, rotateY: -360, rotateX: -90, duration: 0.05, ease: 'none' }, 0
    );

    // Phase 3: Smooth rotation from side to a slight angle to reveal spine
    tl.to(album, {
      rotateY: 25,
      rotateX: 5,
      scale: 1,
      duration: 0.8,
      ease: 'power1.out'
    }, 0.05);

    // Phase 4: Hold + subtle float
    tl.to(album, { y: -10, duration: 0.15, ease: 'sine.inOut' }, 0.85);
    if (ring) {
      tl.to(ring, { scale: 1.1, opacity: 0.3, duration: 0.15, ease: 'sine.inOut' }, 0.85);
    }
  });

  // Pauses music when any of the mini album grid sections are reached
  document.querySelectorAll('.more-albums-section').forEach(moreSec => {
    ScrollTrigger.create({
      trigger: moreSec,
      start: 'top 40%',
      onEnter: () => {
        if (albumAudioPlayer && !albumAudioPlayer.paused) {
          albumAudioPlayer.pause();
          albumAudioPlayer.currentTime = 0;
        }
      }
    });
  });

  // Side Panel Logic
  const sidePanel = document.getElementById('album-side-panel');
  const closeBtn = document.getElementById('panel-close-btn');

  if (sidePanel && closeBtn) {
    const audioPlayerUI = document.getElementById('audio-player-ui');
    const audioCurrentTime = document.getElementById('audio-current-time');
    const audioDuration = document.getElementById('audio-duration');
    const audioProgress = document.getElementById('audio-progress');
    const audioProgressBar = document.getElementById('audio-progress-bar');

    const formatTime = (time) => {
      if (isNaN(time)) return "0:00";
      const min = Math.floor(time / 60);
      const sec = Math.floor(time % 60);
      return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    if (albumAudioPlayer) {
      albumAudioPlayer.addEventListener('timeupdate', () => {
        if (audioCurrentTime) audioCurrentTime.innerText = formatTime(albumAudioPlayer.currentTime);
        if (albumAudioPlayer.duration && audioProgress) {
          const progress = (albumAudioPlayer.currentTime / albumAudioPlayer.duration) * 100;
          audioProgress.style.width = `${progress}%`;
        }
      });
      albumAudioPlayer.addEventListener('loadedmetadata', () => {
        if (audioDuration) audioDuration.innerText = formatTime(albumAudioPlayer.duration);
      });
      albumAudioPlayer.addEventListener('ended', () => {
        if (audioProgress) audioProgress.style.width = '0%';
        if (audioCurrentTime) audioCurrentTime.innerText = '0:00';
      });

      if (audioProgressBar) {
        audioProgressBar.addEventListener('click', (e) => {
          const rect = audioProgressBar.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          albumAudioPlayer.currentTime = pos * albumAudioPlayer.duration;
        });
      }
    }

    const closePanel = () => {
      if (sidePanel.classList.contains('open')) {
        sidePanel.classList.remove('open');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';

        if (typeof lenis !== 'undefined') {
          lenis.start();
        }
      }
    };

    if (panelPlayBtn && albumAudioPlayer) {
      panelPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentAlbumAudio) return;

        if (albumAudioPlayer.paused) {
          const bgMusic = document.getElementById('bg-music');
          const musicBtn = document.getElementById('music-btn');
          if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            window.isPlaying = false;
            if (musicBtn) {
              musicBtn.classList.remove('playing');
              musicBtn.querySelector('i').className = 'fas fa-music';
            }
          }
          albumAudioPlayer.play().catch(e => console.log(e));
        } else {
          albumAudioPlayer.pause();
        }
      });
    }

    // Attach listeners to ALL featured album cards (e.g. Love Featured and Arrogance Featured)
    document.querySelectorAll('.album-featured-art').forEach(albumCard => {
      const frontPlayWrapper = albumCard.querySelector('.album-play-wrapper');

      if (frontPlayWrapper) {
        frontPlayWrapper.addEventListener('click', (e) => {
          e.stopPropagation();

          const img = albumCard.querySelector('img');
          if (img) {
            const src = img.getAttribute('src');
            const filename = src.split('/').pop();
            const data = albumData[filename] || albumData['default'];
            const audio = data.audio || "";
            if (audio) {
              if (!albumAudioPlayer.src || !albumAudioPlayer.src.includes(audio)) {
                albumAudioPlayer.src = audio;
                currentAlbumAudio = audio;
              }
            }
          }

          if (albumAudioPlayer && albumAudioPlayer.paused) {
            const bgMusic = document.getElementById('bg-music');
            const musicBtn = document.getElementById('music-btn');
            if (bgMusic && !bgMusic.paused) {
              bgMusic.pause();
              window.isPlaying = false;
              if (musicBtn) {
                musicBtn.classList.remove('playing');
                musicBtn.querySelector('i').className = 'fas fa-music';
              }
            }
            albumAudioPlayer.play().catch(e => console.log(e));
          } else if (albumAudioPlayer) {
            albumAudioPlayer.pause();
          }
        });
      }

      const frontViewBtn = albumCard.querySelector('.album-view-btn');
      if (frontViewBtn) {
        frontViewBtn.addEventListener('click', (e) => {
          e.stopPropagation();

          const img = albumCard.querySelector('img');
          if (img) {
            const src = img.getAttribute('src');
            const filename = src.split('/').pop();
            const data = albumData[filename] || albumData['default'];

            const audio = data.audio || "";
            if (audio) {
              if (!albumAudioPlayer.src || !albumAudioPlayer.src.includes(audio)) {
                albumAudioPlayer.src = audio;
                currentAlbumAudio = audio;
              }
            }
            if (panelPlayBtn) {
              panelPlayBtn.style.display = 'flex';
              if (audioPlayerUI) audioPlayerUI.style.display = audio ? 'flex' : 'none';
            }
            if (typeof syncPlayButtons !== 'undefined') syncPlayButtons();

            sidePanel.querySelector('.panel-title').innerText = data.title;
            const panelImg = sidePanel.querySelector('#panel-album-img');
            if (panelImg) panelImg.src = src;
            const overlayTitle = albumCard.querySelector('.album-title-overlay');
            if (overlayTitle) overlayTitle.innerText = data.title;
            const spineTitle = albumCard.querySelector('.book-spine span');
            if (spineTitle) spineTitle.innerText = data.title;
            sidePanel.querySelector('.panel-artist').innerHTML = data.artist;
            const stats = sidePanel.querySelectorAll('.stat-value');
            if (stats.length >= 1) {
              stats[0].innerText = data.listens;
            }
            sidePanel.querySelector('.panel-description p').innerText = data.desc;
            sidePanel.querySelector('.platform-btn.spotify').setAttribute('href', data.spotify || '#');
            sidePanel.querySelector('.platform-btn.apple').setAttribute('href', data.apple || '#');
            sidePanel.querySelector('.platform-btn.youtube').setAttribute('href', data.youtube || '#');
            if (sidePanel.querySelector('.platform-btn.soundcloud')) sidePanel.querySelector('.platform-btn.soundcloud').setAttribute('href', data.soundcloud || '#');
            if (sidePanel.querySelector('.platform-btn.instagram')) sidePanel.querySelector('.platform-btn.instagram').setAttribute('href', data.instagram || '#');
          }

          sidePanel.classList.add('open');
          const backdrop = document.getElementById('panel-backdrop');
          if (backdrop) backdrop.classList.add('active');
          document.body.style.overflow = 'hidden';
          if (typeof lenis !== 'undefined') lenis.stop();
        });
      }
    });

    closeBtn.addEventListener('click', closePanel);

    // Close on touch, scroll or click outside
    document.addEventListener('click', (e) => {
      const clickedCard = Array.from(document.querySelectorAll('.album-featured-art')).some(card => card.contains(e.target));
      if (sidePanel.classList.contains('open') && !sidePanel.contains(e.target) && !clickedCard) {
        closePanel();
      }
    });

    document.addEventListener('wheel', (e) => {
      if (sidePanel.classList.contains('open') && !sidePanel.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener('touchstart', (e) => {
      const clickedCard = Array.from(document.querySelectorAll('.album-featured-art')).some(card => card.contains(e.target));
      if (sidePanel.classList.contains('open') && !sidePanel.contains(e.target) && !clickedCard) {
        closePanel();
      }
    });
  }
  // ============================================
  // Focus Modal Logic
  // ============================================
  const focusModal = document.getElementById('album-focus-modal');
  const focusAlbumModel = document.getElementById('focus-album-model');
  const focusOverlay = document.getElementById('focus-overlay');
  const focusBackBtn = document.getElementById('focus-back-btn');
  const focusImg = document.getElementById('focus-album-img');
  const focusImgBack = document.getElementById('focus-album-img-back');
  const focusTitle = document.getElementById('focus-album-title');
  const focusPlayWrapper = document.getElementById('focus-play-wrapper');
  const focusViewBtn = document.getElementById('focus-view-btn');
  const focusHintUp = document.getElementById('focus-hint-up');
  const focusHintDown = document.getElementById('focus-hint-down');
  const focusNavPrev = document.getElementById('focus-nav-prev');
  const focusNavNext = document.getElementById('focus-nav-next');

  let currentFocusAudio = "";
  let activeMiniAlbum = null;

  // Helper: update nav button visibility based on current album position
  const updateNavButtons = (albumNode) => {
    const allAlbums = Array.from(document.querySelectorAll('.mini-album-3d'));
    const idx = allAlbums.indexOf(albumNode);
    if (focusNavPrev) {
      if (idx > 0) { focusNavPrev.classList.add('visible'); }
      else { focusNavPrev.classList.remove('visible'); }
    }
    if (focusNavNext) {
      if (idx < allAlbums.length - 1) { focusNavNext.classList.add('visible'); }
      else { focusNavNext.classList.remove('visible'); }
    }
  };

  // Helper: dim all albums except the active one using CSS classes (not GSAP inline styles)
  // This avoids fighting with ScrollTrigger which also manages opacity/transform on containers
  const dimAlbumsExcept = (activeAlbumNode) => {
    document.querySelectorAll('.mini-album-container').forEach(containerEl => {
      if (containerEl === activeAlbumNode.parentElement) {
        containerEl.classList.remove('focus-dimmed');
      } else {
        containerEl.classList.add('focus-dimmed');
      }
    });
    // Hide the active album-3d since the modal shows it
    activeAlbumNode.classList.add('focus-hidden');
  };

  // Helper: restore all albums back to normal
  const restoreAllAlbums = () => {
    document.querySelectorAll('.mini-album-container').forEach(el => {
      el.classList.remove('focus-dimmed');
    });
    document.querySelectorAll('.mini-album-3d').forEach(el => {
      el.classList.remove('focus-hidden');
      el.style.animationPlayState = 'running';
    });
  };

  // Navigate to a specific album while modal is open (smooth transition)
  const navigateToAlbum = (targetAlbumNode) => {
    if (!targetAlbumNode || !focusModal || focusModal.style.visibility !== 'visible') return;

    // Restore old album visibility
    if (activeMiniAlbum) {
      activeMiniAlbum.classList.remove('focus-hidden');
      activeMiniAlbum.style.animationPlayState = 'running';
    }

    activeMiniAlbum = targetAlbumNode;
    targetAlbumNode.style.animationPlayState = 'paused';

    const img = targetAlbumNode.querySelector('.book-front img');
    if (!img) return;
    const src = img.getAttribute('src');
    const filename = src.split('/').pop();
    const data = albumData[filename] || albumData['default'];
    currentFocusAudio = data.audio || "";

    if (focusTitle) focusTitle.innerText = data.title;

    // Move the focus modal in the DOM to be after the new album's container
    const container = targetAlbumNode.parentElement;
    container.after(focusModal);

    // Dim/hide using CSS classes (no GSAP on containers!)
    dimAlbumsExcept(targetAlbumNode);

    // Animate the album model: flip out → update → flip in
    gsap.to(focusAlbumModel, {
      rotateY: -100, scale: 0.7, opacity: 0, duration: 0.35, ease: "power2.in",
      onComplete: () => {
        if (focusImg) focusImg.src = src;
        if (focusImgBack) focusImgBack.src = src;

        gsap.fromTo(focusAlbumModel,
          { rotateY: 60, scale: 0.7, opacity: 0 },
          { rotateY: -25, rotateX: 10, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.2)" }
        );
      }
    });

    // Update nav button visibility
    updateNavButtons(targetAlbumNode);

    // Update scroll hints visibility dynamically
    const allAlbums = Array.from(document.querySelectorAll('.mini-album-3d'));
    const isFirst = (targetAlbumNode === allAlbums[0]);
    const isLast = (targetAlbumNode === allAlbums[allAlbums.length - 1]);

    if (focusHintUp) {
      gsap.to(focusHintUp, { opacity: isFirst ? 0 : 1, duration: 0.3 });
    }
    if (focusHintDown) {
      gsap.to(focusHintDown, { opacity: isLast ? 0 : 1, duration: 0.3 });
    }

    // Scroll the window / lenis to center the new position of the focusModal
    const targetHeight = window.innerWidth > 768 ? 600 : 420;
    if (typeof lenis !== 'undefined') {
      const offset = -(window.innerHeight - targetHeight) / 2;
      lenis.scrollTo(focusModal, { offset: offset, duration: 1.2 });
    } else {
      setTimeout(() => {
        const rect = focusModal.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const centeredY = absoluteTop - (window.innerHeight - targetHeight) / 2;
        window.scrollTo({ top: centeredY, behavior: 'smooth' });
      }, 50);
    }

    // Handle audio: stop old, play new
    if (albumAudioPlayer && !albumAudioPlayer.paused) {
      albumAudioPlayer.pause();
      albumAudioPlayer.currentTime = 0;
    }
    if (currentFocusAudio) {
      albumAudioPlayer.src = currentFocusAudio;
      const bgMusic = document.getElementById('bg-music');
      const musicBtn = document.getElementById('music-btn');
      if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        window.isPlaying = false;
        if (musicBtn) {
          musicBtn.classList.remove('playing');
          musicBtn.querySelector('i').className = 'fas fa-music';
        }
      }
      setTimeout(() => {
        albumAudioPlayer.play().catch(e => console.log("Auto-play prevented:", e));
        syncPlayButtons();
      }, 300);
    } else {
      syncPlayButtons();
    }
  };

  document.querySelectorAll('.mini-album-3d').forEach(albumNode => {
    albumNode.addEventListener('click', () => {
      if (activeMiniAlbum === albumNode) {
        closeFocusModal();
        return;
      }
      if (activeMiniAlbum && activeMiniAlbum !== albumNode) {
        gsap.killTweensOf(activeMiniAlbum);
        restoreAllAlbums();
      }
      activeMiniAlbum = albumNode;
      const img = albumNode.querySelector('.book-front img');
      if (!img || !focusModal) return;

      const src = img.getAttribute('src');
      const filename = src.split('/').pop();
      const data = albumData[filename] || albumData['default'];

      if (focusImg) focusImg.src = src;
      if (focusImgBack) focusImgBack.src = src;
      if (focusTitle) focusTitle.innerText = data.title;
      currentFocusAudio = data.audio || "";

      // Pause rotation of only the active album, let others keep spinning
      albumNode.style.animationPlayState = 'paused';

      // Measure exact position for seamless pop-out BEFORE moving the modal
      const sourceRect = albumNode.getBoundingClientRect();

      // Smooth 3D Fly-Out from specific album stack position to Center Modal
      const container = albumNode.parentElement;
      container.after(focusModal);

      focusModal.classList.remove('is-closing');

      gsap.killTweensOf([focusModal, focusAlbumModel, focusOverlay, focusBackBtn, focusViewBtn, focusHintUp, focusHintDown]);
      gsap.set(focusModal, { visibility: "visible", pointerEvents: "auto" });
      gsap.to(focusOverlay, { opacity: 1, duration: 0.4 });
      const targetHeight = window.innerWidth > 768 ? 600 : 420;
      gsap.to(focusModal, { height: targetHeight, duration: 0.6, ease: "power2.inOut" });

      if (typeof lenis !== 'undefined') {
        const offset = -(window.innerHeight - targetHeight) / 2;
        lenis.scrollTo(focusModal, { offset: offset, duration: 1.2 });
      } else {
        setTimeout(() => {
          const rect = focusModal.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top;
          const centeredY = absoluteTop - (window.innerHeight - targetHeight) / 2;
          window.scrollTo({ top: centeredY, behavior: 'smooth' });
        }, 50);
      }
      if (focusBackBtn) gsap.to(focusBackBtn, { opacity: 1, duration: 0.4, delay: 0.2 });
      if (focusViewBtn) gsap.to(focusViewBtn, { opacity: 1, duration: 0.4, delay: 0.3 });

      const allAlbums = Array.from(document.querySelectorAll('.mini-album-3d'));
      const isFirst = (albumNode === allAlbums[0]);
      const isLast = (albumNode === allAlbums[allAlbums.length - 1]);

      if (focusHintUp && !isFirst) gsap.to(focusHintUp, { opacity: 1, duration: 0.4, delay: 0.5 });
      if (focusHintDown && !isLast) gsap.to(focusHintDown, { opacity: 1, duration: 0.4, delay: 0.5 });

      // Show prev/next album navigation buttons
      updateNavButtons(albumNode);

      // Temporarily show modal to measure target center
      gsap.set(focusModal, { visibility: "visible", height: targetHeight });
      gsap.set(focusAlbumModel, { x: 0, y: 0, scale: 1, rotateY: 0, rotateX: 0 });
      const targetRect = focusAlbumModel.getBoundingClientRect();
      const startX = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
      const startY = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);

      // Reset modal height for animation
      gsap.set(focusModal, { height: 0 });

      gsap.fromTo(focusAlbumModel,
        { x: startX, y: startY, scale: 0.3, rotateY: -385, rotateX: -80, opacity: 1 },
        { x: 0, y: 0, scale: 1, rotateY: -25, rotateX: 10, opacity: 1, duration: 1.2, ease: "back.out(1.1)" }
      );

      // Dim/hide using CSS classes (doesn't conflict with ScrollTrigger)
      dimAlbumsExcept(albumNode);

      // Auto-play the music when album is clicked
      if (currentFocusAudio) {
        if (!albumAudioPlayer.src || !albumAudioPlayer.src.includes(currentFocusAudio)) {
          albumAudioPlayer.src = currentFocusAudio;
        }
        const bgMusic = document.getElementById('bg-music');
        const musicBtn = document.getElementById('music-btn');
        if (bgMusic && !bgMusic.paused) {
          bgMusic.pause();
          window.isPlaying = false;
          if (musicBtn) {
            musicBtn.classList.remove('playing');
            musicBtn.querySelector('i').className = 'fas fa-music';
          }
        }
        // Add a small delay to ensure DOM updates and modal animation starts before playing
        setTimeout(() => {
          albumAudioPlayer.play().catch(e => console.log("Auto-play prevented:", e));
          syncPlayButtons();
        }, 50);
      } else {
        // If the new album has no audio, ensure we pause the previous audio
        if (albumAudioPlayer && !albumAudioPlayer.paused) {
          albumAudioPlayer.pause();
          syncPlayButtons();
        }
      }
    });
  });

  const closeFocusModal = () => {
    if (focusModal.style.visibility !== 'visible') return;
    if (focusModal.classList.contains('is-closing')) return;

    focusModal.classList.add('is-closing');
    focusModal.style.pointerEvents = "none";

    const targets = [focusModal, focusAlbumModel, focusOverlay, focusBackBtn, focusViewBtn, focusHintUp, focusHintDown];
    gsap.killTweensOf(targets);

    gsap.to(focusOverlay, { opacity: 0, duration: 0.4 });
    if (focusBackBtn) gsap.to(focusBackBtn, { opacity: 0, duration: 0.2 });
    if (focusViewBtn) gsap.to(focusViewBtn, { opacity: 0, duration: 0.2 });
    if (focusHintUp) gsap.to(focusHintUp, { opacity: 0, duration: 0.2 });
    if (focusHintDown) gsap.to(focusHintDown, { opacity: 0, duration: 0.2 });
    // Hide album nav buttons
    if (focusNavPrev) focusNavPrev.classList.remove('visible');
    if (focusNavNext) focusNavNext.classList.remove('visible');

    if (activeMiniAlbum) {
      // Briefly show the active album so we can measure its position for fly-back
      activeMiniAlbum.classList.remove('focus-hidden');

      const sourceRect = activeMiniAlbum.getBoundingClientRect();

      gsap.set(focusAlbumModel, { x: 0, y: 0, scale: 1 });
      const baseRect = focusAlbumModel.getBoundingClientRect();
      const endX = sourceRect.left + sourceRect.width / 2 - (baseRect.left + baseRect.width / 2);
      const endY = sourceRect.top + sourceRect.height / 2 - (baseRect.top + baseRect.height / 2);

      gsap.set(focusAlbumModel, { rotateY: -25, rotateX: 10 });

      gsap.to(focusModal, { height: 0, duration: 0.6, ease: "power2.inOut" });

      // Re-hide it during the fly-back, then show after animation
      activeMiniAlbum.classList.add('focus-hidden');

      gsap.to(focusAlbumModel, {
        x: endX,
        y: endY,
        scale: 0.3,
        rotateY: -385,
        rotateX: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(focusAlbumModel, { x: 0, y: 0, opacity: 1, rotateY: -25, rotateX: 10 });
          gsap.set(focusModal, { visibility: "hidden" });
          focusModal.classList.remove('is-closing');
          activeMiniAlbum = null;

          // Restore all albums via CSS class removal (clean, no inline style conflicts)
          restoreAllAlbums();
        }
      });
    } else {
      gsap.set(focusModal, { visibility: "hidden" });
      focusModal.classList.remove('is-closing');
      restoreAllAlbums();
    }

    if (albumAudioPlayer && !albumAudioPlayer.paused) {
      albumAudioPlayer.pause();
      albumAudioPlayer.currentTime = 0;
      syncPlayButtons();
    }
    if (typeof lenis !== 'undefined' && !sidePanel.classList.contains('open')) {
      lenis.start();
    }
  };

  if (focusOverlay) {
    focusOverlay.addEventListener('click', closeFocusModal);
  }
  if (focusBackBtn) {
    focusBackBtn.addEventListener('click', closeFocusModal);
  }

  // --- Prev / Next Album Navigation ---
  if (focusNavPrev) {
    focusNavPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeMiniAlbum) return;
      const allAlbums = Array.from(document.querySelectorAll('.mini-album-3d'));
      const idx = allAlbums.indexOf(activeMiniAlbum);
      if (idx > 0) navigateToAlbum(allAlbums[idx - 1]);
    });
  }
  if (focusNavNext) {
    focusNavNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeMiniAlbum) return;
      const allAlbums = Array.from(document.querySelectorAll('.mini-album-3d'));
      const idx = allAlbums.indexOf(activeMiniAlbum);
      if (idx < allAlbums.length - 1) navigateToAlbum(allAlbums[idx + 1]);
    });
  }
  let focusScrollAmount = 0;
  let focusTouchStartY = 0;

  document.addEventListener('wheel', (e) => {
    if (focusModal.style.visibility === 'visible') {
      if (sidePanel && sidePanel.contains(e.target)) return;
      focusScrollAmount += Math.abs(e.deltaY);
      if (focusScrollAmount > 600) {
        closeFocusModal();
        focusScrollAmount = 0;
      }
    } else {
      focusScrollAmount = 0;
    }
  });

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      focusTouchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (focusModal.style.visibility === 'visible') {
      if (sidePanel && sidePanel.contains(e.target)) return;
      if (e.touches.length > 0) {
        let delta = Math.abs(e.touches[0].clientY - focusTouchStartY);
        if (delta > 300) {
          closeFocusModal();
        }
      }
    }
  }, { passive: true });

  if (focusImg) {
    focusImg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentFocusAudio && !albumAudioPlayer.src) {
        albumAudioPlayer.src = currentFocusAudio;
      } else if (albumAudioPlayer.src && !albumAudioPlayer.src.includes(currentFocusAudio)) {
        albumAudioPlayer.src = currentFocusAudio;
      }

      if (albumAudioPlayer.paused) {
        const bgMusic = document.getElementById('bg-music');
        const musicBtn = document.getElementById('music-btn');
        if (bgMusic && !bgMusic.paused) {
          bgMusic.pause();
          window.isPlaying = false;
          if (musicBtn) {
            musicBtn.classList.remove('playing');
            musicBtn.querySelector('i').className = 'fas fa-music';
          }
        }
        albumAudioPlayer.play().catch(e => console.log(e));
      } else {
        albumAudioPlayer.pause();
      }
    });
  }

  if (focusViewBtn) {
    focusViewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = focusImg.getAttribute('src');
      const filename = src.split('/').pop();
      const data = albumData[filename] || albumData['default'];

      if (panelPlayBtn) {
        panelPlayBtn.style.display = 'flex';
        const audioPlayerUI = document.getElementById('audio-player-ui');
        if (audioPlayerUI) audioPlayerUI.style.display = currentFocusAudio ? 'flex' : 'none';
      }
      syncPlayButtons();

      sidePanel.querySelector('.panel-title').innerText = data.title;
      const panelImg = sidePanel.querySelector('#panel-album-img');
      if (panelImg) panelImg.src = src;
      sidePanel.querySelector('.panel-artist').innerHTML = data.artist;
      const stats = sidePanel.querySelectorAll('.stat-value');
      if (stats.length >= 1) {
        stats[0].innerText = data.listens;
      }
      sidePanel.querySelector('.panel-description p').innerText = data.desc;
      sidePanel.querySelector('.platform-btn.spotify').setAttribute('href', data.spotify || '#');
      sidePanel.querySelector('.platform-btn.apple').setAttribute('href', data.apple || '#');
      sidePanel.querySelector('.platform-btn.youtube').setAttribute('href', data.youtube || '#');
      if (sidePanel.querySelector('.platform-btn.soundcloud')) sidePanel.querySelector('.platform-btn.soundcloud').setAttribute('href', data.soundcloud || '#');
      if (sidePanel.querySelector('.platform-btn.instagram')) sidePanel.querySelector('.platform-btn.instagram').setAttribute('href', data.instagram || '#');

      sidePanel.classList.add('open');
      const backdrop = document.getElementById('panel-backdrop');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (typeof lenis !== 'undefined') lenis.stop();
    });
  }
}

// Initialize new section
initAlbumShowcase();

// Explore More heading animation (Love Section)
const headingExplore = document.getElementById('heading-explore');
const headingMore = document.getElementById('heading-more');
if (headingExplore && headingMore) {
  gsap.to(headingExplore, {
    x: '60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#love-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
  gsap.to(headingMore, {
    x: '-60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#love-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// Explore Arrogance heading animation (Arrogance Section)
const headingExploreArrogance = document.getElementById('heading-explore-arrogance');
const headingArrogance = document.getElementById('heading-arrogance');
if (headingExploreArrogance && headingArrogance) {
  gsap.to(headingExploreArrogance, {
    x: '60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#arrogance-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
  gsap.to(headingArrogance, {
    x: '-60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#arrogance-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// Explore Gujarati heading animation (Gujarati Section)
const headingExploreGujarati = document.getElementById('heading-explore-gujarati');
const headingGujarati = document.getElementById('heading-gujarati');
if (headingExploreGujarati && headingGujarati) {
  gsap.to(headingExploreGujarati, {
    x: '60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#gujarati-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
  gsap.to(headingGujarati, {
    x: '-60vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#gujarati-albums-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// Explore More Albums Scroll Animation (Up from bottom with tilt/rotation)
document.querySelectorAll('.mini-album-container').forEach((album, index) => {
  // Alternate initial tilt direction for a dynamic staggered feel
  const rotZ = index % 2 === 0 ? 15 : -15;

  gsap.fromTo(album,
    {
      y: 150,
      opacity: 0,
      rotationZ: rotZ,
      scale: 0.8
    },
    {
      y: 0,
      opacity: 1,
      rotationZ: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: album,
        start: "top 95%",
        end: "bottom 5%",
        toggleActions: "play reverse play reverse"
      }
    }
  );
});

// --- 6. Premium 3D Mouse Parallax Tilt for Hero Section (Desktop Only) ---
if (window.innerWidth > 768) {
  const hero = document.querySelector('.hero');
  const heroImg = document.getElementById('main-character-img');
  const textGroups = document.querySelectorAll('.hero-text-group');
  const backdrop = document.querySelector('.hero-backdrop');

  if (hero && heroImg) {
    hero.addEventListener('mousemove', (e) => {
      const { width, height } = hero.getBoundingClientRect();
      const xVal = (e.clientX - width / 2) / (width / 2); // -1 to 1
      const yVal = (e.clientY - height / 2) / (height / 2); // -1 to 1

      // Dynamic 3D tilt of the artist cutout portrait
      gsap.to(heroImg, {
        rotateY: xVal * 12,
        rotateX: -yVal * 12,
        x: xVal * 15,
        y: yVal * 15,
        duration: 0.8,
        ease: "power2.out"
      });

      // Depth offset for the frosted glass backdrop
      if (backdrop) {
        gsap.to(backdrop, {
          x: -xVal * 10,
          y: -yVal * 10,
          duration: 0.8,
          ease: "power2.out"
        });
      }

      // Parallax shifts for text groups
      textGroups.forEach((group, index) => {
        const factor = index === 0 ? 25 : 35;
        gsap.to(group, {
          x: xVal * factor,
          y: yVal * factor,
          duration: 0.8,
          ease: "power2.out"
        });
      });
    });

    // Clean reset on mouse leave
    hero.addEventListener('mouseleave', () => {
      gsap.to([heroImg, backdrop, ...textGroups], {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 1.2,
        ease: "power3.out"
      });
    });
  }
}

// --- 7. Auto-cycling Highlight Hover Effect for Social Media Icons ---
(function initSocialsAutoHover() {
  const socialLinks = document.querySelectorAll('.hero-socials a');
  if (socialLinks.length === 0) return;

  let currentIndex = 0;

  setInterval(() => {
    // Remove active-hover class from all links
    socialLinks.forEach(link => link.classList.remove('active-hover'));

    // Add to the current one
    socialLinks[currentIndex].classList.add('active-hover');

    // Increment index circularly
    currentIndex = (currentIndex + 1) % socialLinks.length;
  }, 1000);
})();

// --- 8. Premium Day & Night Theme Toggler Logic ---
(function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const updateToggleUI = (theme, animate = false) => {
    const icon = themeToggle.querySelector('i');
    const label = themeToggle.querySelector('span');

    if (theme === 'dark') {
      if (label) label.innerText = 'NIGHT';
      if (icon) {
        if (animate) {
          gsap.to(icon, {
            rotation: 360,
            opacity: 0,
            scale: 0.5,
            duration: 0.25,
            onComplete: () => {
              icon.className = 'fas fa-moon';
              gsap.to(icon, { rotation: 0, opacity: 1, scale: 1, duration: 0.25 });
            }
          });
        } else {
          icon.className = 'fas fa-moon';
        }
      }
    } else {
      if (label) label.innerText = 'DAY';
      if (icon) {
        if (animate) {
          gsap.to(icon, {
            rotation: -360,
            opacity: 0,
            scale: 0.5,
            duration: 0.25,
            onComplete: () => {
              icon.className = 'fas fa-sun';
              gsap.to(icon, { rotation: 0, opacity: 1, scale: 1, duration: 0.25 });
            }
          });
        } else {
          icon.className = 'fas fa-sun';
        }
      }
    }
  };

  // Set initial state matching document attribute (which was set in the head)
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateToggleUI(currentTheme);

  themeToggle.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';

    // Transition theme attribute
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Dynamic UI Update
    updateToggleUI(newTheme, true);

    // Smooth layout triggers for scroll triggers
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  });
})();
