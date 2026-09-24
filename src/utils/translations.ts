export type Language = 'en' | 'ka';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ka: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & Common
  'app.title': {
    en: 'G.K. BTU Students',
    ka: 'G.K. BTU Students',
  },
  'app.badge': {
    en: 'AI & Proctoring',
    ka: 'AI და პროქტორინგი',
  },
  'app.subtitle': {
    en: 'Autonomous Educational Agent & Anti-Cheat Examination System',
    ka: 'ავტონომიური საგანმანათლებლო AI აგენტი და უსაფრთხო საგამოცდო სისტემა',
  },
  'role.student': {
    en: 'Student',
    ka: 'სტუდენტი',
  },
  'role.admin': {
    en: 'Admin & Proctor',
    ka: 'ადმინისტრატორი და პროქტორი',
  },
  'nav.switch_profile': {
    en: 'Switch Student Profile',
    ka: 'სტუდენტის პროფილის შეცვლა',
  },
  'nav.ws_connected': {
    en: 'Proctoring WS Connected',
    ka: 'პროქტორინგის WS დაკავშირებულია',
  },
  'nav.ws_connecting': {
    en: 'Connecting WS...',
    ka: 'WS კავშირი მყარდება...',
  },
  'nav.active_proctoring': {
    en: 'Active Proctoring',
    ka: 'აქტიური პროქტორინგი',
  },

  // Student Tabs
  'tab.teaching_agent': {
    en: 'AI Teaching Agent',
    ka: 'AI მასწავლებელი',
  },
  'tab.examinations': {
    en: 'Examinations',
    ka: 'გამოცდები',
  },
  'tab.my_submissions': {
    en: 'My Submissions',
    ka: 'ჩემი შედეგები',
  },
  'tab.morning_digest': {
    en: 'Morning News Digest',
    ka: 'დილის სიახლეები & დაიჯესტი',
  },

  // Admin Tabs
  'tab.live_monitor': {
    en: 'Live Exam Monitor',
    ka: 'პირდაპირი მონიტორინგი',
  },
  'tab.test_manager': {
    en: 'Test Management & Grading',
    ka: 'ტესტების მართვა და შეფასება',
  },
  'tab.knowledge_base': {
    en: 'Knowledge Base (RAG)',
    ka: 'ცოდნის ბაზა (RAG)',
  },
  'tab.students': {
    en: 'Students',
    ka: 'სტუდენტები',
  },
  'tab.cron_digest': {
    en: 'Morning Digest Scheduler',
    ka: 'დაიჯესტის ავტომატიზაცია',
  },

  // Language selector
  'lang.en': {
    en: 'English',
    ka: 'English',
  },
  'lang.ka': {
    en: 'ქართული',
    ka: 'ქართული',
  },

  // AI Teaching Agent
  'agent.title': {
    en: 'AI Teaching & Research Agent',
    ka: 'AI სასწავლო და კვლევითი აგენტი',
  },
  'agent.subtitle': {
    en: 'Interactive Socratic tutor grounded in university syllabus & research papers',
    ka: 'ინტერაქტიული სოკრატული რეპეტიტორი, დაფუძნებული საუნივერსიტეტო სილაბუსზე',
  },
  'agent.subject_focus': {
    en: 'Subject Focus',
    ka: 'საგნობრივი მიმართულება',
  },
  'agent.welcome_title': {
    en: 'University AI Teaching & Research Agent',
    ka: 'საუნივერსიტეტო AI სასწავლო და კვლევითი აგენტი',
  },
  'agent.welcome_body': {
    en: 'Hello! I am dynamically grounded in your actual course syllabus notes, textbook excerpts, and research papers. How can I assist your engineering studies today? You can ask me to explain theoretical proofs, walk through algorithms, write code implementations, or test your comprehension with practice exam problems.',
    ka: 'მოგესალმებით! მე ვარ თქვენი საუნივერსიტეტო AI რეპეტიტორი. ჩემი ცოდნა ეფუძნება თქვენს რეალურ კურსის სილაბუსს, კონსპექტებსა და აკადემიურ ლიტერატურას. რით შემიძლია დაგეხმაროთ დღეს? შემიძლია აგიხსნათ თეორიული დამტკიცებები, ალგორითმები, კოდის იმპლემენტაცია ან მოგამზადოთ საგამოცდო საკითხებისთვის.',
  },
  'agent.quick_prompts': {
    en: 'Recommended Study Prompts',
    ka: 'რეკომენდებული სასწავლო კითხვები',
  },
  'agent.input_placeholder': {
    en: 'Ask a theoretical question, explore an algorithm, or request syllabus clarification...',
    ka: 'დასვით თეორიული კითხვა, განიხილეთ ალგორითმი ან მოითხოვეთ სილაბუსის განმარტება...',
  },
  'agent.send': {
    en: 'Send',
    ka: 'გაგზავნა',
  },
  'agent.thinking': {
    en: 'Reasoning through syllabus notes...',
    ka: 'სილაბუსის კონსპექტების ანალიზი...',
  },
  'agent.clear_chat': {
    en: 'Clear Chat',
    ka: 'ჩატის გასუფთავება',
  },
  'agent.view_syllabus_docs': {
    en: 'View Syllabus Documents',
    ka: 'სილაბუსის დოკუმენტების ნახვა',
  },
  'agent.citations': {
    en: 'Syllabus Citations',
    ka: 'სილაბუსის წყაროები',
  },

  // Student Exam Center
  'exam.center_title': {
    en: 'Examinations & Proctored Tests',
    ka: 'გამოცდები და პროქტორინგის ტესტები',
  },
  'exam.center_desc': {
    en: 'Secure university assessments monitored by real-time anti-cheat telemetry and automated grading.',
    ka: 'დაცული საუნივერსიტეტო გამოცდები რეალურ დროში ანტი-თაღლითობის მონიტორინგითა და ავტომატური შეფასებით.',
  },
  'exam.filter_all': {
    en: 'All Assessments',
    ka: 'ყველა გამოცდა',
  },
  'exam.filter_active': {
    en: 'Available Now',
    ka: 'ხელმისაწვდომი',
  },
  'exam.filter_completed': {
    en: 'Completed',
    ka: 'ჩაბარებული',
  },
  'exam.duration': {
    en: 'Duration',
    ka: 'ხანგრძლივობა',
  },
  'exam.total_points': {
    en: 'Total Points',
    ka: 'საერთო ქულა',
  },
  'exam.passing_score': {
    en: 'Passing Score',
    ka: 'გამსვლელი ქულა',
  },
  'exam.questions_count': {
    en: 'Questions',
    ka: 'კითხვები',
  },
  'exam.start_button': {
    en: 'Begin Examination',
    ka: 'გამოცდის დაწყება',
  },
  'exam.view_submission': {
    en: 'View Graded Results',
    ka: 'შედეგების ნახვა',
  },
  'exam.status_passed': {
    en: 'PASSED',
    ka: 'ჩაბარებულია',
  },
  'exam.status_failed': {
    en: 'FAILED',
    ka: 'ვერ ჩაბარდა',
  },
  'exam.status_active': {
    en: 'ACTIVE',
    ka: 'აქტიური',
  },
  'exam.status_upcoming': {
    en: 'UPCOMING',
    ka: 'მომავალი',
  },

  // Exam Taking Screen & Pause Feature
  'taking.anti_cheat_notice': {
    en: 'Anti-Cheat Enforcement Active: Tab switching, window minimization, and clipboard actions are logged in real-time.',
    ka: 'ანტი-თაღლითობის კონტროლი აქტიურია: ჩანართის გადართვა, ფანჯრის შემცირება და კოპირება ფიქსირდება რეალურ დროში.',
  },
  'taking.pause_button': {
    en: 'Pause Exam',
    ka: 'გამოცდის დაპაუზება',
  },
  'taking.pauses_left': {
    en: 'pauses left',
    ka: 'შესვენება დარჩენილია',
  },
  'taking.question': {
    en: 'Question',
    ka: 'კითხვა',
  },
  'taking.of': {
    en: 'of',
    ka: '-',
  },
  'taking.points': {
    en: 'points',
    ka: 'ქულა',
  },
  'taking.flag_question': {
    en: 'Flag for Review',
    ka: 'მონიშვნა გადასახედად',
  },
  'taking.previous': {
    en: 'Previous',
    ka: 'წინა',
  },
  'taking.next': {
    en: 'Next',
    ka: 'შემდეგი',
  },
  'taking.submit_exam': {
    en: 'Finish & Submit Exam',
    ka: 'გამოცდის დასრულება და ჩაბარება',
  },
  'taking.answered': {
    en: 'Answered',
    ka: 'პასუხგაცემული',
  },
  'taking.pause_modal_title': {
    en: 'Request Temporary Exam Pause',
    ka: 'დროებითი შესვენების / პაუზის მოთხოვნა',
  },
  'taking.pause_modal_desc': {
    en: 'You can take up to 3 authorized pauses during your examination. The countdown timer will freeze, and window/tab changes during the pause will not be flagged as violations.',
    ka: 'გამოცდის განმავლობაში შეგიძლიათ გამოიყენოთ მაქსიმუმ 3 ავტორიზებული შესვენება. ტაიმერი შეჩერდება და ფანჯრის/ჩანართის ცვლილება არ ჩაითვლება დარღვევად.',
  },
  'taking.pause_reason_label': {
    en: 'Select Reason for Pause',
    ka: 'აირჩიეთ შესვენების მიზეზი',
  },
  'taking.pause_confirm': {
    en: 'Confirm & Pause Exam',
    ka: 'დადასტურება და დაპაუზება',
  },
  'taking.cancel': {
    en: 'Cancel',
    ka: 'გაუქმება',
  },
  'taking.paused_overlay_title': {
    en: 'Your Examination is Temporarily Paused',
    ka: 'თქვენი გამოცდა დროებით შეჩერებულია',
  },
  'taking.paused_overlay_desc': {
    en: 'The countdown timer is currently frozen. Questions are hidden for integrity. When you are ready, click below to resume immediately.',
    ka: 'დროის ათვლა შეჩერებულია. კითხვები დაფარულია უსაფრთხოების მიზნით. როცა მზად იქნებით, დააჭირეთ ქვემოთ ღილაკს გამოცდის გასაგრძელებლად.',
  },
  'taking.resume_button': {
    en: 'Resume Exam Now',
    ka: 'გამოცდის გაგრძელება',
  },
  'taking.pause_time_elapsed': {
    en: 'Pause Elapsed',
    ka: 'პაუზის ხანგრძლივობა',
  },
  'taking.submit_confirm_title': {
    en: 'Ready to Submit Your Exam?',
    ka: 'მზად ხართ გამოცდის ჩასაბარებლად?',
  },
  'taking.submit_confirm_desc': {
    en: 'Once submitted, your answers will be evaluated immediately with automated grading and submitted to the academic ledger.',
    ka: 'ჩაბარების შემდეგ თქვენი პასუხები შეფასდება ავტომატურად და შეტანილი იქნება აკადემიურ უწყისში.',
  },

  // Daily Digest / News ("all new also must be Georgian")
  'digest.banner_title': {
    en: 'Academic Morning Digests & Research Briefings',
    ka: 'აკადემიური დილის დაიჯესტი და კვლევითი სიახლეები',
  },
  'digest.banner_desc': {
    en: 'Every morning at 08:00, the digest collects real startup news from free RSS feeds (TechCrunch, Crunchbase News, Sifted and more), and a free AI model summarizes it for the course.',
    ka: 'ყოველ დილით 08:00 საათზე დაიჯესტი აგროვებს რეალურ სიახლეებს უფასო RSS არხებიდან (TechCrunch, Crunchbase News, Sifted და სხვ.), ხოლო უფასო AI მოდელი მათ კურსისთვის აჯამებს.',
  },
  'digest.subscribe': {
    en: 'Subscribe for Morning Digest',
    ka: 'დილის დაიჯესტის გამოწერა',
  },
  'digest.subscribed': {
    en: 'Subscribed to Morning Digest',
    ka: 'დაიჯესტი გამოწერილია',
  },
  'digest.archive_title': {
    en: 'Digest Archive',
    ka: 'დაიჯესტის არქივი',
  },
  'digest.challenge_of_day': {
    en: 'Challenge of the Day',
    ka: 'დღის საგამოცდო გამოწვევა',
  },
  'digest.show_explanation': {
    en: 'Show Answer & Detailed Explanation',
    ka: 'პასუხისა და დეტალური ახსნის ნახვა',
  },
  'digest.curated_updates': {
    en: 'Curated Industry Updates',
    ka: 'შერჩეული ინდუსტრიული სიახლეები',
  },
  'digest.academic_connection': {
    en: 'Academic Connection',
    ka: 'აკადემიური კავშირი კურსთან',
  },
  'digest.run_now': {
    en: 'Run Morning Cron Job Now',
    ka: 'დაიჯესტის გენერირება ახლავე',
  },
  'digest.run_in_georgian': {
    en: 'Generate in Georgian (ქართულად)',
    ka: 'გენერირება ქართულად',
  },
  'digest.run_in_english': {
    en: 'Generate in English',
    ka: 'გენერირება ინგლისურად',
  },

  // Admin Live Monitor
  'monitor.title': {
    en: 'Real-Time Examination Telemetry Monitor',
    ka: 'გამოცდების პირდაპირი ტელემეტრიის მონიტორინგი',
  },
  'monitor.subtitle': {
    en: 'Live WebSocket supervision of candidate visibility, focus events, authorized pauses, and exam integrity.',
    ka: 'სტუდენტების პირდაპირი ზედამხედველობა: ფანჯრის ფოკუსი, ავტორიზებული შესვენებები და გამოცდის უსაფრთხოება.',
  },
  'monitor.in_exam': {
    en: 'In Exam',
    ka: 'გამოცდაზე',
  },
  'monitor.paused': {
    en: 'Paused',
    ka: 'შესვენებაზე',
  },
  'monitor.currently_away': {
    en: 'Currently Away',
    ka: 'გასულია',
  },
  'monitor.audio_alerts': {
    en: 'Audio Alerts',
    ka: 'ხმოვანი შეტყობინებები',
  },
  'monitor.active_candidates': {
    en: 'Active Exam Candidates',
    ka: 'აქტიური სტუდენტები',
  },
  'monitor.no_active_candidates': {
    en: 'No active student sessions currently in progress.',
    ka: 'ამ მომენტში აქტიური საგამოცდო სესიები არ მიმდინარეობს.',
  },
  'monitor.student_paused_badge': {
    en: 'EXAM PAUSED',
    ka: 'გამოცდა დაპაუზებულია',
  },
  'monitor.student_on_pause': {
    en: 'Student is on Authorized Pause',
    ka: 'სტუდენტი იმყოფება შესვენებაზე',
  },
  'monitor.pauses_left_badge': {
    en: 'pauses left',
    ka: 'შესვენება დარჩენილია',
  },
  'monitor.pauses_used': {
    en: 'Pauses Used',
    ka: 'გამოყენებული შესვენებები',
  },
  'monitor.tab_hidden': {
    en: 'TAB HIDDEN',
    ka: 'ჩანართი დამალულია',
  },
  'monitor.focus_lost': {
    en: 'FOCUS LOST',
    ka: 'ფოკუსი დაკარგულია',
  },
  'monitor.active_in_tab': {
    en: 'ACTIVE IN TAB',
    ka: 'აქტიური ჩანართში',
  },
  'monitor.send_warning': {
    en: 'Send Warning Message',
    ka: 'გაფრთხილების გაგზავნა',
  },
  'monitor.live_events_log': {
    en: 'Live Telemetry & Proctoring Event Stream',
    ka: 'პირდაპირი ტელემეტრიისა და პროქტორინგის ჟურნალი',
  },
  'monitor.col_timestamp': {
    en: 'Timestamp',
    ka: 'დრო',
  },
  'monitor.col_student': {
    en: 'Student',
    ka: 'სტუდენტი',
  },
  'monitor.col_event': {
    en: 'Event Type',
    ka: 'მოვლენის ტიპი',
  },
  'monitor.col_severity': {
    en: 'Severity',
    ka: 'სიმძიმე',
  },
  'monitor.col_details': {
    en: 'Telemetry Details',
    ka: 'დეტალები',
  },

  // Admin Test Manager
  'admin.tests_title': {
    en: 'Examination Management & Submissions',
    ka: 'გამოცდების მართვა და ნაშრომები',
  },
  'admin.create_test': {
    en: 'Create New Examination',
    ka: 'ახალი გამოცდის შექმნა',
  },
  'admin.manage_tests': {
    en: 'Manage Tests',
    ka: 'ტესტების მართვა',
  },
  'admin.student_submissions': {
    en: 'Student Submissions',
    ka: 'სტუდენტების ნაშრომები',
  },

  // Admin Knowledge Base
  'admin.kb_title': {
    en: 'Syllabus Knowledge Base (RAG)',
    ka: 'სილაბუსის ცოდნის ბაზა (RAG)',
  },
  'admin.add_doc': {
    en: 'Add Syllabus Document',
    ka: 'სილაბუსის დოკუმენტის დამატება',
  },

  // Admin Students
  'admin.students_title': {
    en: 'Enrolled Engineering Scholars',
    ka: 'ჩარიცხული სტუდენტები',
  },
  'admin.add_student': {
    en: 'Add Student Profile',
    ka: 'სტუდენტის დამატება',
  },

  // Notifications
  'notify.student_paused_title': {
    en: 'Student Paused Exam',
    ka: 'სტუდენტმა გამოცდა დააპაუზა',
  },
  'notify.reason': {
    en: 'Reason',
    ka: 'მიზეზი',
  },
};

export const pauseReasonsKA: Record<string, string> = {
  'Restroom / Personal Break': 'საპირფარეშო / პირადი შესვენება',
  'Hydration / Quick Snack': 'წყალი / მსუბუქი წახემსება',
  'Stretch / Physical Comfort': 'გაჭიმვა / ფიზიკური განტვირთვა',
  'Medical / Medication': 'სამედიცინო / მედიკამენტის მიღება',
  'Technical Issue / Peripheral Check': 'ტექნიკური შემოწმება / მოწყობილობა',
  'Other Reason': 'სხვა მიზეზი',
};

export const proctorEventsKA: Record<string, string> = {
  'tab_hidden': 'ჩანართი დამალულია (Tab Hidden)',
  'tab_visible': 'ჩანართზე დაბრუნება (Tab Visible)',
  'window_blur': 'ფოკუსის დაკარგვა (Window Blur)',
  'window_focus': 'ფოკუსის დაბრუნება (Window Focus)',
  'copy_attempt': 'კოპირების მცდელობა (Copy)',
  'paste_attempt': 'ჩასმის მცდელობა (Paste)',
  'context_menu': 'კონტექსტური მენიუ (Right Click)',
  'fullscreen_exit': 'სრული ეკრანიდან გამოსვლა',
  'proctor_warning': 'პროქტორის გაფრთხილება',
  'timer_expired': 'დრო ამოიწურა',
  'exam_paused': 'გამოცდა დაპაუზდა (Exam Paused)',
  'exam_resumed': 'გამოცდა გაგრძელდა (Exam Resumed)',
};
