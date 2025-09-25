// Lunotech/static/js/script.js

// ==========================
//  THREE.js Scene
// ==========================
class LunarExplorer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.moon = null;
    this.stars = null;
    this.mountain = null;
    this.prefersReducedMotion = false;
    this.assetsLoaded = false;
    this.moonriseAnimationStarted = false;
    this.loadingBarElement = document.getElementById("loading-bar");

    this.init();
  }

  init() {
    const container = document.getElementById("canvas-container");
    this.moonUrl = container?.dataset.moonUrl;
    this.mountainUrl = container?.dataset.mountainUrl;
    this.checkReducedMotion();
    this.setupScene();
    this.createStarfield();
    this.loadAssets();
    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  checkReducedMotion() {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.prefersReducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener("change", (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera FOV is set to 45
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById("canvas-container");
    if (container) {
      container.appendChild(this.renderer.domElement);
    }
  }

  createStarfield() {
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  loadAssets() {
    const manager = new THREE.LoadingManager();

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.updateLoadingProgress(progress);
    };

    manager.onLoad = () => {
      this.assetsLoaded = true;
      this.hideLoadingScreen();
      this.animateMoonRise();
    };

    const textureLoader = new THREE.TextureLoader(manager);

    textureLoader.load(
      this.moonUrl,
      (texture) => { this.createMoon(texture); },
      undefined,
      (error) => { console.error("Failed to load moon texture:", error); }
    );

    textureLoader.load(
      this.mountainUrl,
      (texture) => { this.createMountain(texture); },
      undefined,
      (error) => { console.warn("Failed to load mountain texture.", error); }
    );
  }

  updateLoadingProgress(progress) {
    if (this.loadingBarElement) {
      this.loadingBarElement.style.width = `${progress}%`;
    }
  }

  createMoon(moonTexture) {
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.moon = new THREE.Mesh(geometry, material);
    this.moon.castShadow = true;
    this.moon.receiveShadow = true;
    this.moon.position.set(0, -3, -1);
    this.moon.scale.set(0, 0, 0);
    this.scene.add(this.moon);
  }

  createMountain(mountainTexture) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: mountainTexture,
      transparent: true,
      alphaTest: 0.1,
    });

    this.mountain = new THREE.Mesh(geometry, material);
    this.scene.add(this.mountain);

    // Set the initial size and position correctly by calling onWindowResize
    this.onWindowResize();
  }

  animateMoonRise() {
    if (!this.moon || this.moonriseAnimationStarted) return;
    this.moonriseAnimationStarted = true;

    if (!this.prefersReducedMotion) {
      const tl = gsap.timeline();
      tl.to(this.moon.scale, {
        x: 0.765,
        y: 0.765,
        z: 0.765,
        duration: 4,
        ease: "power3.out",
      }).to(
        this.moon.position,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 4,
          ease: "power3.out",
        },
        0
      );
    } else {
      this.moon.scale.set(0.765, 0.765, 0.765);
      this.moon.position.set(0, 0, 0);
    }
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.mountain && this.mountain.material.map && this.mountain.material.map.image) {
        const texture = this.mountain.material.map;
        const imgAspect = texture.image.width / texture.image.height;
        const viewAspect = width / height;

        // Get the visible height of the viewport at the mountain's Z-depth
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const visibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(this.camera.position.z - this.mountain.position.z);
        const visibleWidth = visibleHeight * this.camera.aspect;

        // This logic mimics CSS 'background-size: cover'
        if (viewAspect > imgAspect) {
            // Viewport is wider than the image: scale to fit viewport width
            this.mountain.scale.x = visibleWidth;
            this.mountain.scale.y = visibleWidth / imgAspect;
        } else {
            // Viewport is taller than the image: scale to fit viewport height
            this.mountain.scale.y = visibleHeight;
            this.mountain.scale.x = visibleHeight * imgAspect;
        }

        // Always align the mountain to the bottom of the screen
        this.mountain.position.y = (-visibleHeight / 2);
        this.mountain.position.z = 2; // Keep mountain in front
    }
}

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.stars && !this.prefersReducedMotion) {
      this.stars.rotation.y += 0.0002;
    }

    if (this.moon && !this.prefersReducedMotion && this.moonriseAnimationStarted) {
      this.moon.rotation.y += 0.05 * 0.016;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LunarExplorer();
});


// ===========================================
//  Header (with i18n for FA/EN & persistence)
// ===========================================
const ICON_GLOBE =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <circle cx="12" cy="12" r="10"></circle>
     <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
     <path d="M2 12h20"></path>
   </svg>`;

const ICON_CHEVRON =
  `<svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
     <polyline points="6,9 12,15 18,9"></polyline>
   </svg>`;

const I18N = {
  en: {
    _name: "English",
    home: "Home",
    about: "About",
    services: "Services",
    blog: "Blog",
    contact: "Contact Us",
    cta_text:"HAVE A PROJECT IN MIND?",
    developed:"Development by",
    credit_name:"Arash rasouly && Amir karimi",
    social_github:"GitHub",
    social_telegram:"Telegram",
    social_instagram:"instagram",
    hero_title:"Lunotech",
    social_linkedin:"LinkedIn",
    social_whatsapp:"whatsapp",
    hero_title:"Innovation beyond the digital frontier",
    hero_description:"Your ideas and our technology unite to become a shining star in the digital universe",
    btn_primary:" ",
    btn_outline:" ",
    header_services_title:"Services",
    services_cards: [
                          {
                            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6m0 6v6"/>
                              <path d="m21 12-6-3-6 3-6-3"/>
                              <path d="m21 12-6 3-6-3-6 3"/>
                              <path d="m12 1 6 3-6 3-6-3z"/>
                          </svg>`,
                            title:"Brand & Visual Identity",
                            description:"We create a unique visual identity for your business that tells your story and captures the attention of your customers.",
                            details: {
                              fullDescription: "Your visual identity is the first point of contact with a customer. With a deep understanding of your business and audience, we design a cohesive identity system—including your logo, color palette, and typography—to ensure your brand looks professional and unified across all platforms.",
                              features: [
                                "Brand Discovery & Strategy Session",
                                "Logo Design & Variations",
                                "Color Palette & Brand Typography",
                                "Business Card & Stationery Design",
                                "Brand Style Guide Delivery",
                              ],
                              applications: "Increased Brand Recognition & Credibility , Attracting Loyal Customers , Attracting Loyal Customers"
                            }
                          },
                          {
                            icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M13 7L9 3 5 7l4 4 4-4z"/>
                              <path d="m17 11 4 4-4 4-4-4 4-4z"/>
                              <path d="m8 12 4 4 6-6-4-4Z"/>
                              <path d="m16 8 3-3"/>
                              <path d="M9 21a6 6 0 0 0-6-6"/>
                          </svg>`,
                            title:"Website Design & Development",
                            description:"Your website is the center of your digital world. We design responsive, fast, and user-friendly websites that convert visitors into customers.",
                            details: {
                              fullDescription: "We go beyond beautiful visuals to prioritize an exceptional user experience (UX) and user interface (UI). Your website will be built to achieve your specific business goals—whether it's sales, lead generation, or showcasing services—using the latest technologies for flawless performance on all devices.",
                              features: [
                                "UI/UX Design",
                                "Fully Responsive Development",
                                "Optimized for Speed & SEO",
                                "E-commerce & Payment Gateway Integration",
                              ],
                              applications: "Increased Sales & Lead Generation , Professional Showcase of Your Services , 24/7 Availability for Your Customers"
                            }
                          },
                          {
                            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
                              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                              <path d="M10 9a3 3 0 0 0 0 6"/>
                              <path d="M14 9a3 3 0 0 1 0 6"/>
                          </svg>`,
                            title:"Intelligent Automation & Bots",
                            description:"Automate your repetitive business processes. We design intelligent bots that increase your efficiency and provide 24/7 service to your customers.",
                            details: {
                              fullDescription: "Your time is your most valuable asset. By building intelligent chatbots for your website and social media, we automate customer support, appointment booking, and data collection. This allows your team to focus on more important tasks and reduces operational costs.",
                              features: [
                                "Custom Website Chatbot Development",
                                "Automated FAQ & Support Responses",
                                "Application Bot Integration (Telegram Bot)",
                                "Lead Generation & Qualification Bots",
                                "Automated Appointment Booking Systems",
                              ],
                              applications: "Significant Increase in Efficiency & Time Saved , Enhanced Customer Experience & Satisfaction , Reduced Operational & Support Costs , Instant, 24/7 Customer Engagement"
                            }
                          }
                        ],
        blog_title:"Latest Blogs",
        blog_btn:"EXPLORE MORE",
        blog_read_btn:"READ",
        form_title:"Send us a Message",
        submit_btn:"Send Message",
        info_title:"Contact Information",
        info_content_phone:"Phone",
        info_content_email:"Email",
        info_content_hours:"Business Hours",
        social_links_title:"Follow Us",
        last_seen:"min read",
        name_label:"Name",
        name_placeholder:"Your Name",
        email_label:"Email",
        email_placeholder:"Your Email",
        subject_label:"Subject",
        subject_placeholder:"Your subject",
        message_label:"Message",
        message_placeholder:"Your Message",
        search_placeholder:"search",
        section_title_about:"ABOUT US",
        section_subtitle_about:"",
        about_explain: "LUNOTECH stands at the intersection of cosmic exploration and technological innovation...",
    about_section: {
        tagline: "Who We Are",
        title: "Architects of Digital Identity",
        description: "Lunotech is a digital design studio dedicated to building purposeful and integrated digital identities. We believe a successful digital experience is the result of the intelligent intersection of aesthetics, flawless functionality, and transparent strategy.",
        principles: [
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l.707.707M19.071 4.929l.707-.707M12 21a9 9 0 110-18 9 9 0 010 18z"></path></svg>`,
                title: "Strategy-Driven Design",
                description: "We don't just build; we architect. Every project begins with a deep dive into your goals to ensure the final product is a powerful business tool."
            },
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7-7 7zM3 10v4a2 2 0 002 2h4M3 10V6a2 2 0 012-2h4"></path></svg>`,
                title: "Pixel-Perfect Execution",
                description: "Our passion for detail means your digital identity will be crafted with precision, ensuring a flawless and premium user experience on every device."
            },
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>`,
                title: "Future-Proof Technology",
                description: "We build with modern, scalable technologies to create solutions that are not only effective today but are also ready for the challenges of tomorrow."
            }
        ]
    }


  },
  fa: {
    _name: "فارسی",
    home: "خانه",
    about: "درباره ما",
    services: "خدمات",
    blog: "بلاگ",
    contact: "تماس با ما",
    cta_text:"در ذهنت پروژه داری؟",
    developed:"توسعه توسط",
    credit_name:"آرش رسولی و امیر کریمی",
    social_github:"گیت هاب",
    social_telegram:"تلگرام",
    social_instagram:"اینستاگرام",
    social_linkedin:"لینکدین",
    social_whatsapp:"واتساپ",
    hero_title:"نوآوری، فراتر از مرزهای دیجیتال",
    hero_description:"ایده‌های شما در کنار تخصص و تکنولوژی ما، به ستاره ای روشن در آسمان دیجیتال تبدیل میشود",
    btn_primary:"سسس",
    btn_outline:" ",
    header_services_title:"خدمات",
    header_services_discription:"ما با ارائه راهکارهای یکپارچه، شما را در مسیر موفقیت همراهی میکنیم",
    services_cards:[
                    {
                      title: "طراحی برند و هویت بصری",
                      description:
                        "ما یک هویت بصری منحصربه‌فرد برای کسب‌وکار شما خلق می‌کنیم که داستان شما را روایت کرده و در ذهن مشتریان ماندگار می‌شود",
                      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6m0 6v6"/>
                              <path d="m21 12-6-3-6 3-6-3"/>
                              <path d="m21 12-6 3-6-3-6 3"/>
                              <path d="m12 1 6 3-6 3-6-3z"/>
                          </svg>`,
                      details: {
                        fullDescription:
                          "هویت بصری شما، اولین نقطه تماس با مشتری است. ما با درک عمیق از کسب‌وکار و مخاطبان شما، یک سیستم هویتی منسجم طراحی می‌کنیم که شامل لوگو، رنگ‌ها، فونت‌ها و الگوهای گرافیکی است تا برند شما در تمام پلتفرم‌ها حرفه‌ای و یکپارچه به نظر برسد.",
                        features: [
                          "جلسه کشف برند و تدوین استراتژی",
                          "طراحی لوگوی اصلی و نسخه‌های فرعی",
                          "انتخاب پالت رنگی و فونت‌های برند",
                          "طراحی کارت ویزیت و ست اداری",
                          "ارائه کتابچه راهنمای برند (Brand Guideline)",
                        ],
                        applications:
                          "جذب مشتریان وفادار , ایجاد تمایز از رقبا , افزایش شناخت و اعتبار برند",
                      },
                    },
                    {
                      title: "طراحی و توسعه وب سایت",
                      description:
                        "وب‌ سایت شما، مرکز دنیای آنلاین شماست. ما وب‌سایت‌هایی واکنش‌گرا، سریع و کاربرپسند طراحی می‌کنیم که بازدیدکنندگان را به مشتری تبدیل می‌کنند",
                      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M13 7L9 3 5 7l4 4 4-4z"/>
                              <path d="m17 11 4 4-4 4-4-4 4-4z"/>
                              <path d="m8 12 4 4 6-6-4-4Z"/>
                              <path d="m16 8 3-3"/>
                              <path d="M9 21a6 6 0 0 0-6-6"/>
                          </svg>`,
                      details: {
                        fullDescription:
                          "ما فراتر از یک طراحی زیبا، به تجربه کاربری (UX) و رابط کاربری (UI) اهمیت می‌دهیم. وب‌سایت شما بر اساس اهداف کسب‌وکارتان (فروش، جذب سرنخ، معرفی خدمات) و با استفاده از جدیدترین تکنولوژی‌ها ساخته می‌شود تا عملکردی بی‌نقص در تمام دستگاه‌ها داشته باشد",
                        features: [
                          "طراحی رابط کاربری (UI) و تجربه کاربری (UX)",
                          "طراحی کاملاً واکنش‌گرا (Responsive)",
                          "سرعت بارگذاری بهینه شده برای سئو",
                          "تصال به درگاه‌های پرداخت آنلاین",
                        ],
                        applications:
                          "طراحی کاملاً واکنش‌گرا (Responsive) , سرعت بارگذاری بهینه شده برای سئو , تصال به درگاه‌های پرداخت آنلاین",
                      },
                    },
                    {
                      title: "اتوماسیون هوشمند و ربات‌های آنلاین",
                      description:
                        "فرآیندهای تکراری کسب‌وکار خود را هوشمند کنید. ما ربات‌هایی طراحی می‌کنیم که بهره‌وری شما را افزایش داده و به مشتریان شما ۲۴ ساعته خدمات ارائه می‌دهند",
                      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
                              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                              <path d="M10 9a3 3 0 0 0 0 6"/>
                              <path d="M14 9a3 3 0 0 1 0 6"/>
                          </svg>`,
                      details: {
                        fullDescription:
                          "زمان شما ارزشمندترین دارایی شماست. ما با ساخت ربات‌های هوشمند (Chatbot) برای وب‌سایت و شبکه‌های اجتماعی شما، فرآیندهای پاسخگویی به مشتریان، رزرو وقت و جمع‌آوری اطلاعات را خودکار می‌کنیم. این به تیم شما اجازه می‌دهد تا بر روی کارهای مهم‌تر تمرکز کند و هزینه‌ها را کاهش دهد",
                        features: [
                          "ساخت ربات برای تلگرام و دیگر برنامه ها",
                          "سیستم خودکار رزرو وقت و قرار ملاقات",
                          "اتصال به سیستم‌های مدیریت مشتری (CRM)",
                          "سیستم خودکار جمع آوری اطلاعات مشتریان",
                        ],
                        applications:
                          "پاسخگویی فوری و ۲۴ ساعته به مشتریان , کاهش هزینه‌های نیروی انسانی برای پشتیبانی , بهبود تجربه و رضایت مشتریان , افزایش چشمگیر بهره‌وری و صرفه‌جویی در زمان",
                      },
                    },
                  ],
    blog_title:"آخرین اخبار و رویدادها",
    blog_btn:"مشاهده همه",
    blog_read_btn:"اطلاعات بیشتر",
    form_title:"ارسال پیام به ما",
    submit_btn:"ارسال پیام",
    info_title:"اطلاعات ارتباط",
    info_content_phone:"تلفن",
    info_content_email:"ایمیل",
    info_content_hours:"ساعت کاری",
    social_links_title:"ما را دنبال کنید",
    last_seen:"دقیقه خواندن",
    name_label:"نام",
    name_placeholder:"نام شما",
    email_label:"ایمیل",
    email_placeholder:"ایمیل شما",
    subject_label:"موضوع",
    subject_placeholder:"موضوع شما",
    message_label:"پیام",
    message_placeholder:"پیام شما",
    search_placeholder:"جستجو",
    section_title_about:"درباره ما",
    about_explain: "لونوتک در نقطه تلاقی کاوش‌های کیهانی و نوآوری تکنولوژیک ایستاده است...",
    about_section: {
        tagline: "ما که هستیم",
        title: "معماران هویت دیجیتال",
        description: "لونوتک یک گروه طراحی دیجیتال است که به ساخت و توسعه هویت‌های دیجیتال هدفمند و یکپارچه اختصاص دارد. ما باور داریم که یک تجربه دیجیتال موفق، حاصل تلاقی هوشمندانه زیبایی‌شناسی، کارایی بی‌نقص و استراتژی شفاف است.",
        principles: [
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l.707.707M19.071 4.929l.707-.707M12 21a9 9 0 110-18 9 9 0 010 18z"></path></svg>`,
                title: "طراحی استراتژی-محور",
                description: "ما فقط نمی‌سازیم؛ ما معماری می‌کنیم. هر پروژه با درک عمیق اهداف شما آغاز می‌شود تا اطمینان حاصل شود محصول نهایی یک ابزار قدرتمند تجاری است."
            },
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7-7 7zM3 10v4a2 2 0 002 2h4M3 10V6a2 2 0 012-2h4"></path></svg>`,
                title: "اجرای بی‌نقص و دقیق",
                description: "علاقه ما به جزئیات به این معناست که هویت دیجیتال شما با دقتی بی‌نظیر ساخته می‌شود و تجربه‌ای ممتاز و بی‌نقص را در هر دستگاهی تضمین می‌کند."
            },
            {
                icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>`,
                title: "تکنولوژی آینده-نگر",
                description: "ما با تکنولوژی‌های مدرن و مقیاس‌پذیر می‌سازیم تا راه‌حل‌هایی ایجاد کنیم که نه تنها امروز مؤثر هستند، بلکه برای چالش‌های فردا نیز آماده‌اند."
            }
        ]
    }
  },
};

class GlassmorphismHeader {
  constructor() {
    this.activeItem = "Home";
    this.isMobileMenuOpen = false;

    // language state
    this.lang = this.getInitialLang(); // 'en' | 'fa'

    this.init();
  }

  getInitialLang() {
    const saved = localStorage.getItem("siteLang");
    if (saved === "fa" || saved === "en") return saved;

    // fallback from current document direction (if server set it)
    const dir = document.documentElement.getAttribute("dir");
    if (dir === "rtl") return "fa";
    return "en";
  }

  init() {
    this.applyLanguage(this.lang); // set texts + dir before binding events
    this.bindEvents();
    this.syncTriggersLabel();
  }

  // --- i18n helpers ---
  normalizeToLang(value) {
    const t = (value || "").toLowerCase().trim();
    if (t.includes("fa") || t.includes("فار") || t.includes("persian") || t.includes("farsi")) return "fa";
    return "en";
  }

  setDirFor(lang) {
    const isFA = lang === "fa";
    document.documentElement.setAttribute("lang", isFA ? "fa" : "en");
    document.documentElement.setAttribute("dir", isFA ? "rtl" : "ltr");
    document.body.classList.toggle("rtl", isFA);
  }

  // Update visible label on triggers to current language
  syncTriggersLabel() {
    const dropdownTrigger = document.querySelector(".dropdown-trigger");
    if (dropdownTrigger) dropdownTrigger.innerHTML = `${ICON_GLOBE} ${I18N[this.lang]._name} ${ICON_CHEVRON}`;

    const mobileDropdownTrigger = document.querySelector(".mobile-dropdown-trigger");
    if (mobileDropdownTrigger) {
      const span = mobileDropdownTrigger.querySelector("span");
      if (span) span.textContent = I18N[this.lang]._name;
    }
  }

  applyLanguage(lang) {
    // Direction + attrs
    this.setDirFor(lang);

    // --- Dynamic Content Population ---
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = key.split('.').reduce((obj, k) => obj && obj[k], I18N[lang]);
      if (value) {
        el.innerHTML = value;
      }
    });

    // Desktop nav items by order: Home, About, Services, Blog
    const desktopItems = document.querySelectorAll(".nav-items .nav-item");
    if (desktopItems[0]) desktopItems[0].textContent = I18N[lang].home;
    if (desktopItems[1]) desktopItems[1].textContent = I18N[lang].about;
    if (desktopItems[2]) desktopItems[2].textContent = I18N[lang].services;
    if (desktopItems[3]) desktopItems[3].textContent = I18N[lang].blog;

    // Mobile nav items by order
    const mobileItems = document.querySelectorAll(".mobile-nav-items .mobile-nav-item");
    if (mobileItems[0]) mobileItems[0].textContent = I18N[lang].home;
    if (mobileItems[1]) mobileItems[1].textContent = I18N[lang].about;
    if (mobileItems[2]) mobileItems[2].textContent = I18N[lang].services;
    if (mobileItems[3]) mobileItems[3].textContent = I18N[lang].blog;

    // Contact buttons
    document.querySelectorAll(".contact-btn").forEach((b) => (b.textContent = I18N[lang].contact));
    document.querySelectorAll(".mobile-contact-btn").forEach((b) => (b.textContent = I18N[lang].contact));
    document.querySelectorAll(".cta-text").forEach((b) => (b.textContent = I18N[lang].cta_text));
    document.querySelectorAll(".developed").forEach((b) => (b.textContent = I18N[lang].developed));
    document.querySelectorAll(".credit-name").forEach((b) => (b.textContent = I18N[lang].credit_name));
    document.querySelectorAll(".social_Instagram").forEach((b) => (b.textContent = I18N[lang].social_instagram));
    document.querySelectorAll(".social_github").forEach((b) => (b.textContent = I18N[lang].social_github));
    document.querySelectorAll(".social_Telegram").forEach((b) => (b.textContent = I18N[lang].social_telegram));
    document.querySelectorAll(".social_linkedin").forEach((b) => (b.textContent = I18N[lang].social_linkedin));
    document.querySelectorAll(".social_whatsapp").forEach((b) => (b.textContent = I18N[lang].social_whatsapp));
    document.querySelectorAll(".hero-title").forEach((b) => (b.textContent = I18N[lang].hero_title));
    document.querySelectorAll(".hero-description").forEach((b) => (b.textContent = I18N[lang].hero_description));
    document.querySelectorAll(".header_services_title").forEach((b) => (b.textContent = I18N[lang].header_services_title));
    document.querySelectorAll(".header_services_discription").forEach((b) => (b.textContent = I18N[lang].header_services_discription));
    document.querySelectorAll(".grok-blog-main-title").forEach((b) => (b.textContent = I18N[lang].blog_title));
    document.querySelectorAll(".grok-blog-explore-btn").forEach((b) => (b.textContent = I18N[lang].blog_btn));
    document.querySelectorAll(".grok-blog-read-btn").forEach((b) => (b.textContent = I18N[lang].blog_read_btn));
    document.querySelectorAll(".form-title").forEach((b) => (b.textContent = I18N[lang].form_title));
    document.querySelectorAll(".submit-btn").forEach((b) => (b.textContent = I18N[lang].submit_btn));
    document.querySelectorAll(".info-title").forEach((b) => (b.textContent = I18N[lang].info_title));
    document.querySelectorAll(".info-content-phone").forEach((b) => (b.textContent = I18N[lang].info_content_phone));
    document.querySelectorAll(".info-content-email").forEach((b) => (b.textContent = I18N[lang].info_content_email));
    document.querySelectorAll(".info-content-hours").forEach((b) => (b.textContent = I18N[lang].info_content_hours));
    document.querySelectorAll(".social-links-title").forEach((b) => (b.textContent = I18N[lang].social_links_title));
    document.querySelectorAll(".btn-primary").forEach((b) => (b.textContent = I18N[lang].btn_primary));
    document.querySelectorAll(".btn-outline").forEach((b) => (b.textContent = I18N[lang].btn_outline));
    document.querySelectorAll(".last_seen").forEach((b) => (b.textContent = I18N[lang].last_seen));
    document.querySelectorAll(".section-title-about").forEach((b) => (b.textContent = I18N[lang].section_title_about));
    document.querySelectorAll(".section-subtitle-about").forEach((b) => (b.textContent = I18N[lang].section_subtitle_about));
    document.querySelectorAll(".about_explain").forEach((b) => (b.textContent = I18N[lang].about_explain));
    document.body.style.cssText = (lang === 'fa') ? "font-family: koodak;" : "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";




    document.querySelectorAll("label[for='id_name']").forEach(
      (lbl) => (lbl.textContent = I18N[lang].name_label)
    );
    document.querySelectorAll("#id_name").forEach(
      (inp) => (inp.placeholder = I18N[lang].name_placeholder)
    );
    document.querySelectorAll("label[for='id_email']").forEach(
      (lbl) => (lbl.textContent = I18N[lang].email_label)
    );
    document.querySelectorAll("#id_email").forEach(
      (inp) => (inp.placeholder = I18N[lang].email_placeholder)
    );
    document.querySelectorAll("label[for='id_subject']").forEach(
      (lbl) => (lbl.textContent = I18N[lang].subject_label)
    );
    document.querySelectorAll("#id_subject").forEach(
      (inp) => (inp.placeholder = I18N[lang].subject_placeholder)
    );
    document.querySelectorAll("label[for='id_message']").forEach(
      (lbl) => (lbl.textContent = I18N[lang].message_label)
    );
    document.querySelectorAll("#id_message").forEach(
      (inp) => (inp.placeholder = I18N[lang].message_placeholder)
    );
    document.querySelectorAll("#searchInput").forEach(
      (inp) => (inp.placeholder = I18N[lang].search_placeholder)
    );


    document.querySelectorAll(".logo-img").forEach((img) => img.style.transform = (lang === "fa") ? "scaleX(-1)" : "scaleX(1)");



    // Persist
    localStorage.setItem("siteLang", lang);

    // Update labels on triggers
    this.syncTriggersLabel();
    this.renderServices(lang);
    

  }

renderServices(lang) {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  grid.innerHTML = ""; // پاک کردن قبلی
  I18N[lang].services_cards.forEach((service) => {
    const card = document.createElement("div");
    card.className = "service-card animate";
    card.innerHTML = `
      <div class="glowing-edge"></div>
      <div class="inner-glow"></div>
      <div class="service-content">
        <div class="service-icon">${service.icon}</div>
        <h3 class="service-title">${service.title}</h3>
        <p class="service-description">${service.description}</p>
        <div class="learn-more">${lang === "en" ? "Learn More" : "بیشتر بدانید"}</div>
      </div>
      <div class="corner-tl"></div>
      <div class="corner-br"></div>
    `;


    card.addEventListener("click", () => showModal(service));
    grid.appendChild(card);
  });
}

  changeLanguage(lang) {
    if (lang !== "fa" && lang !== "en") lang = "en";
    this.lang = lang;
    this.applyLanguage(lang);
  }


  bindEvents() {
    // Desktop navigation items (active highlight)
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        this.setActiveItem(e.target.dataset.item || e.target.textContent.trim());
      });
    });

    // Mobile navigation items
    const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
    mobileNavItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        this.setActiveItem(e.target.dataset.item || e.target.textContent.trim());
        this.closeMobileMenu();
      });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle");
    menuToggle?.addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    // Mobile close button
    const mobileCloseBtn = document.querySelector(".mobile-close-btn");
    mobileCloseBtn?.addEventListener("click", () => {
      this.closeMobileMenu();
    });

    // Mobile overlay
    const mobileOverlay = document.querySelector(".mobile-overlay");
    mobileOverlay?.addEventListener("click", () => {
      this.closeMobileMenu();
    });

    // Desktop dropdown
    const dropdown = document.querySelector(".dropdown");
    const dropdownTrigger = document.querySelector(".dropdown-trigger");
    dropdownTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("active");
    });

    // Desktop dropdown items -> change language
    const dropdownItems = document.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const raw = e.target.getAttribute("data-lang") || e.target.textContent;
        const lang = this.normalizeToLang(raw);
        this.changeLanguage(lang);
        dropdown?.classList.remove("active");
      });
    });

    // Mobile dropdown
    const mobileDropdown = document.querySelector(".mobile-dropdown");
    const mobileDropdownTrigger = document.querySelector(".mobile-dropdown-trigger");
    mobileDropdownTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileDropdown?.classList.toggle("active");
    });

    // Mobile dropdown items -> change language
    const mobileDropdownItems = document.querySelectorAll(".mobile-dropdown-item");
    mobileDropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const raw = e.target.getAttribute("data-lang") || e.target.textContent;
        const lang = this.normalizeToLang(raw);
        this.changeLanguage(lang);
        mobileDropdown?.classList.remove("active");
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      dropdown?.classList.remove("active");
      document.querySelector(".mobile-dropdown")?.classList.remove("active");
    });

    // Contact buttons
    const contactBtns = document.querySelectorAll(".contact-btn, .mobile-contact-btn");
    contactBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.closeMobileMenu();
      });
    });
  }

  setActiveItem(item) {
    this.activeItem = item;

    // Update desktop nav items
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((navItem) => {
      navItem.classList.remove("active");
      if (navItem.dataset.item === item) {
        navItem.classList.add("active");
      }
    });

    // Update mobile nav items
    const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
    mobileNavItems.forEach((navItem) => {
      navItem.classList.remove("active");
      if (navItem.dataset.item === item) {
        navItem.classList.add("active");
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.updateMobileMenu();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.updateMobileMenu();
  }

  updateMobileMenu() {
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileOverlay = document.querySelector(".mobile-overlay");
    const menuIcon = document.querySelector(".menu-icon");
    const closeIcon = document.querySelector(".close-icon");

    if (this.isMobileMenuOpen) {
      mobileMenu?.classList.add("active");
      mobileOverlay?.classList.add("active");
      menuIcon?.classList.add("hidden");
      closeIcon?.classList.remove("hidden");
    } else {
      mobileMenu?.classList.remove("active");
      mobileOverlay?.classList.remove("active");
      menuIcon?.classList.remove("hidden");
      closeIcon?.classList.add("hidden");
    }
  }
}

// Initialize the header when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new GlassmorphismHeader();
});




document.addEventListener("DOMContentLoaded", () => {
  // اتصال دکمه بستن
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", hideModal);
  }

  // اتصال کلیک روی بک‌گراند
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") {
        hideModal();
      }
    });
  }
});

// Show modal with service details
function showModal(service) {
  if (!modalBody || !modalOverlay) return;

  // تعیین زبان جاری از localStorage
  const currentLang = localStorage.getItem("siteLang") || "en";

  modalBody.innerHTML = `
    <div class="modal-header">
        <div class="modal-icon">${service.icon}</div>
        <h3 class="modal-title">${service.title}</h3>
        <p class="modal-description">${service.details.fullDescription}</p>
    </div>
    
    <div class="features-section">
        <h4 class="features-title">
          ${currentLang === "fa" ? "خدمات کلیدی" : "Key Features"}
        </h4>
        <ul class="features-list">
          ${service.details.features
            .map(
              (feature) => `
                <li>
                    <div class="feature-bullet"></div>
                    ${feature}
                </li>
            `
            )
            .join("")}
        </ul>
    </div>
    
    <div class="applications-section">
        <h4 class="applications-title">
          ${currentLang === "fa" ? "اهداف استفاده" : "Applications"}
        </h4>
        <p>${service.details.applications}</p>
    </div>
  `;

  modalOverlay.classList.add("active");
}

// Hide modal
function hideModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Event listeners
function setupEventListeners() {
  if (servicesGrid) {
    servicesGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".service-card");
      if (card) {
        const serviceTitle = card.dataset.service;
        const service = services.find((s) => s.title === serviceTitle);
        if (service) {
          showModal(service);
        }
      }
    });
  }

  closeBtn?.addEventListener("click", hideModal);

  modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      hideModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay?.classList.contains("active")) {
      hideModal();
    }
  });
}

class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Add staggered delay based on card position
            const delay = index * 200;
            setTimeout(() => {
              entry.target.classList.add("animate");
            }, delay);

            // Stop observing this element once animated
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );
  }

  observeCards() {
    const cards = document.querySelectorAll(".service-card");
    cards.forEach((card) => {
      this.observer.observe(card);
    });
  }
}

// Initialize scroll animations
const scrollAnimations = new ScrollAnimations();

// Initialize the application
function init() {
  generateServiceCards();
  setupEventListeners();
  scrollAnimations.observeCards();
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// ===================
// Marquee (fixed version)
// ===================
function generateMarqueeContent() {
  const marqueeContent = document.getElementById("marqueeContent");
  if (!marqueeContent) return;

  // همیشه انگلیسی
  const text = "ignite your digital dream by moonlight creativity";

  // پاکسازی قبلی در صورت رندر دوباره
  marqueeContent.innerHTML = "";

  // ایجاد 8 آیتم برای روان بودن حرکت
  for (let i = 0; i < 8; i++) {
    const item = document.createElement("div");
    item.className = "marquee-item";

    const textSpan = document.createElement("span");
    textSpan.className = "marquee-text";
    textSpan.textContent = text;

    // همیشه LTR حتی وقتی کل صفحه RTL هست
    textSpan.setAttribute("dir", "ltr");
    textSpan.style.unicodeBidi = "bidi-override";

    item.appendChild(textSpan);
    marqueeContent.appendChild(item);
  }

  // اعمال تنظیمات اجباری برای شروع درست در حالت RTL
  marqueeContent.style.direction = "ltr";
  marqueeContent.style.justifyContent = "flex-start";
}

// کنترل سرعت حرکت
function adjustScrollSpeed(speed = 10) {
  const marqueeContent = document.getElementById("marqueeContent");
  if (marqueeContent) marqueeContent.style.animationDuration = `${speed}s`;
}

// همیشه از راست به چپ حرکت کنه (فارغ از زبان سایت)
function forceMarqueeDirection() {
  const marqueeContent = document.getElementById("marqueeContent");
  if (!marqueeContent) return;
  marqueeContent.style.animationDirection = "normal"; // از راست به چپ
  marqueeContent.style.direction = "ltr"; // جهت نوشتار LTR
}

// مقداردهی اولیه
document.addEventListener("DOMContentLoaded", () => {
  generateMarqueeContent();
  forceMarqueeDirection();
});

// ===================
// Projects (original)
// ===================
const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description:
      "A modern e-commerce solution built with Next.js and Stripe integration for seamless online shopping experiences.",
    label: "Project 01",
  },
  {
    id: 2,
    title: "Task Management App",
    description:
      "Collaborative task management tool with real-time updates, team collaboration features, and intuitive design.",
    label: "Project 02",
  },
  {
    id: 3,
    title: "Portfolio Website",
    description:
      "Responsive portfolio website showcasing creative work with smooth animations and optimized performance.",
    label: "Project 03",
  },
  {
    id: 4,
    title: "Mobile Banking App",
    description:
      "Secure mobile banking application with biometric authentication and comprehensive financial management tools.",
    label: "Project 04",
  },
  {
    id: 5,
    title: "AI Chat Interface",
    description:
      "Intelligent chat interface powered by machine learning with natural language processing capabilities.",
    label: "Project 05",
  },
];

// Generate project cards
function generateProjectCards() {
  const container = document.getElementById("projects-container");
  if (!container) return;

  projects.forEach((project, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = "project-card";
    // Adjust the 'top' value for sticky positioning
    cardElement.style.top = `${100 + index * 25}px`;

    cardElement.innerHTML = `
            <div class="card-inner">
                <div class="glassmorphism-overlay"></div>
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="project-number">${project.id}</div>
                        <span class="project-label">${project.label}</span>
                    </div>
                    <div class="card-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
                <div class="card-content">
                    <h2 class="project-title">${project.title}</h2>
                    <p class="project-description">${project.description}</p>
                    <div class="card-footer">
                        <button class="view-project-btn" onclick="viewProject(${project.id})">
                            <span style="position: relative; z-index: 10;">View Project</span>
                            <div class="btn-overlay"></div>
                        </button>
                        <div class="footer-dots">
                            <div class="footer-dot active"></div>
                            <div class="footer-dot inactive"></div>
                            <div class="footer-dot inactive"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    container.appendChild(cardElement);
  });
}

// View project function
function viewProject(projectId) {
  console.log(`[v0] Viewing project ${projectId}`);
  alert(`Opening project ${projectId}`);
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  generateProjectCards();
  console.log("[v0] Project cards generated successfully");
});

// ==========================
// Blog animations (original)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".grok-blog-header");
  if (header) {
    setTimeout(() => {
      header.classList.add("grok-blog-fade-in");
    }, 100);
  }

  const blogPosts = document.querySelectorAll(".grok-blog-post");
  blogPosts.forEach((post, index) => {
    setTimeout(() => {
      post.classList.add("grok-blog-slide-up");
    }, 200 + index * 200);
  });
});

document.querySelector(".grok-blog-explore-btn")?.addEventListener("click", () => {
  console.log("Explore more clicked");
});

document.querySelectorAll(".grok-blog-read-btn").forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Read button clicked");
  });
});

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("grok-blog-slide-up");
    }
  });
}, observerOptions);

document.querySelectorAll(".grok-blog-post").forEach((post) => {
  observer.observe(post);
});

class BlogPage {
    constructor() {
        this.allPosts = [];        // array of { node, id, title, excerpt, category, tags[], publishDate, views, likes, comments, bookmarked }
        this.filteredPosts = [];
        this.displayedPosts = [];
        this.currentPage = 1;
        this.postsPerPage = 6;
        this.currentCategory = 'all';
        this.currentSort = 'newest';
        this.searchTerm = '';
        this.isLoading = false;

        this.init();
    }

    init() {
        this.collectServerPosts();      // read posts already rendered by Django
        this.setupEventListeners();
        this.initializeAnimations();
        this.filterAndDisplayPosts();
    }

    collectServerPosts() {
        const blogGrid = document.getElementById('blogGrid');
        if (!blogGrid) return;

        // find all server-rendered article nodes and build data objects
        const nodes = Array.from(blogGrid.querySelectorAll('.blog-card'));
        this.allPosts = nodes.map(node => {
            // hide node for now (we'll append/show when needed)
            node.style.display = 'none';

            const tagsRaw = node.dataset.tags || '';
            const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [];

            return {
                node,
                id: parseInt(node.dataset.id) || null,
                title: (node.querySelector('.blog-title')?.textContent || '').trim(),
                excerpt: (node.querySelector('.blog-excerpt')?.textContent || '').trim(),
                category: (node.dataset.category || '').trim(),
                tags,
                publishDate: node.dataset.publishDate || node.dataset.publishdate || '',
                views: parseInt(node.dataset.views) || 0,
                likes: parseInt(node.dataset.likes) || 0,
                comments: parseInt(node.dataset.comments) || 0,
                bookmarked: (node.dataset.bookmarked === 'true')
            };
        });

        // detach nodes from DOM to control insertion order (optional but clearer)
        // Keep nodes in memory; remove all children from blogGrid
        blogGrid.innerHTML = '';
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.filterAndDisplayPosts();
            });
        }

        // Category filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.currentCategory = e.target.dataset.category;
                this.currentPage = 1;
                this.filterAndDisplayPosts();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.filterAndDisplayPosts();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }

        // Delegate bookmark/share clicks using blogGrid (since nodes are re-inserted)
        const blogGrid = document.getElementById('blogGrid');
        blogGrid.addEventListener('click', (e) => {
            const bookmark = e.target.closest('.bookmark-btn');
            if (bookmark) {
                e.stopPropagation();
                const id = parseInt(bookmark.dataset.id);
                this.toggleBookmark(id);
                bookmark.classList.toggle('active');
                return;
            }
            const share = e.target.closest('.share-btn');
            if (share) {
                e.stopPropagation();
                const id = parseInt(share.dataset.id);
                const post = this.allPosts.find(p => p.id === id);
                if (post) this.sharePost(post);
                return;
            }
        });
    }

    filterAndDisplayPosts() {
        // Filter posts according to category + search term
        this.filteredPosts = this.allPosts.filter(post => {
            const categoryMatch = this.currentCategory === 'all' || post.category === this.currentCategory;
            const searchMatch = !this.searchTerm ||
                (post.title && post.title.toLowerCase().includes(this.searchTerm)) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(this.searchTerm)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)));

            return categoryMatch && searchMatch;
        });

        // Sort
        this.sortPosts();

        // Reset pagination + displayed
        this.displayedPosts = [];
        this.currentPage = 1;

        // Clear grid and hide no-results
        document.getElementById('noResults').style.display = 'none';
        document.getElementById('blogGrid').innerHTML = '';

        this.loadMorePosts();
    }

    sortPosts() {
        this.filteredPosts.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return new Date(b.publishDate) - new Date(a.publishDate);
                case 'oldest':
                    return new Date(a.publishDate) - new Date(b.publishDate);
                case 'popular':
                    return b.views - a.views;
                case 'liked':
                    return b.likes - a.likes;
                default:
                    return 0;
            }
        });
    }

    loadMorePosts() {
        if (this.isLoading) return;

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const blogGrid = document.getElementById('blogGrid');
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const newPosts = this.filteredPosts.slice(startIndex, endIndex);

        if (newPosts.length === 0) {
            if (this.currentPage === 1) {
                this.showNoResults();
            }
            return;
        }

        this.isLoading = true;
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading...</div>';
            loadMoreBtn.disabled = true;
        }

        // simulate small delay for UX (can be removed)
        setTimeout(() => {
            newPosts.forEach((post, idx) => {
                // append the original node (server-rendered) into grid
                blogGrid.appendChild(post.node);
                post.node.style.display = ''; // show
                // add fade animation
                setTimeout(() => post.node.classList.add('fade-in-up'), idx * 80);
                this.displayedPosts.push(post);
            });

            this.currentPage++;
            this.isLoading = false;

            // Update load more button
            const hasMorePosts = endIndex < this.filteredPosts.length;
            if (hasMorePosts && loadMoreBtn) {
                loadMoreBtn.innerHTML = 'Load More Articles';
                loadMoreBtn.disabled = false;
                loadMoreBtn.style.display = '';
            } else if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }

            if (this.displayedPosts.length === 0) this.showNoResults();
        }, 250);
    }

    toggleBookmark(postId) {
        const post = this.allPosts.find(p => p.id === postId);
        if (post) {
            post.bookmarked = !post.bookmarked;
            // reflect visually already handled by toggling class on button in delegated click
            // TODO: optionally send AJAX to server to persist bookmark
        }
    }

    sharePost(post) {
        if (!post) return;
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.excerpt,
                url: window.location.href + '#post-' + post.id
            }).catch(() => {/* ignore errors */});
        } else {
            navigator.clipboard.writeText(window.location.href + '#post-' + post.id).then(() => {
                alert('لینک کپی شد');
            }).catch(() => {
                alert('Unable to copy link');
            });
        }
    }

    showNoResults() {
        document.getElementById('noResults').style.display = 'block';
        document.querySelector('.load-more-container').style.display = 'none';
    }

    initializeAnimations() {
        // keep GSAP animations for hero/search
        if (typeof gsap !== 'undefined') {
            gsap.to('.hero-title', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out'
            });
            gsap.to('.hero-subtitle', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.2,
                ease: 'power3.out'
            });
            gsap.to('.search-filter-container', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.4,
                ease: 'power3.out'
            });
        } else {
            // fallback: simple show
            document.querySelectorAll('.hero-title, .hero-subtitle, .search-filter-container').forEach(el => {
                el.style.opacity = 1;
                el.style.transform = 'translateY(0)';
            });
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BlogPage();
});
