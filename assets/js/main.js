/**
 * Madhavbaug Diabomatic™ Shots - High Conversion COD Landing Page Logic
 * Features:
 * 1. Single Hero Showcase / Interactive Gallery
 * 2. Pricing & Bundle Sync
 * 3. Unified COD Lead Modal with Name, Contact, Address, City, State
 * 4. 24-Hour Duplicate Prevention by Contact Number
 * 5. Google Sheets Webhook Integration
 * 6. Sticky Mobile Bar & Accordion FAQ
 */

// ==============================================================================
// GOOGLE SHEETS WEBHOOK CONFIGURATION
// Deploy google_apps_script.js in Google Sheets and paste your Web App URL below:
// ==============================================================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzTgZn-4OqyGZueNxYAOd_4Yg2xRfNnqqEhBg8-X1AKKQgvXvLk-ICKyHFL6JhKpYUP/exec';

// Local Storage Key & 24 Hours Cooldown (24 * 60 * 60 * 1000 ms)
const SUBMITTED_CONTACTS_KEY = 'madhavbaug_diabomatic_contacts_24h';
const DUPLICATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Interactive Product Gallery (if present)
  // ==========================================================================
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryViewport = document.getElementById('galleryViewport');
  const slides = document.querySelectorAll('.gallery-slide');
  const thumbs = document.querySelectorAll('.gallery-thumbnails .thumb-item');
  const dots = document.querySelectorAll('.gallery-dot');
  const prevBtn = document.getElementById('galleryPrevBtn');
  const nextBtn = document.getElementById('galleryNextBtn');

  let currentSlide = 0;
  const totalSlides = slides.length;

  function goToSlide(index) {
    if (totalSlides === 0) return;
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentSlide = index;

    if (galleryTrack) {
      galleryTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === currentSlide);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide + 1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide - 1);
    });
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => goToSlide(i));
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });

  // Touch swipe support
  if (galleryViewport && galleryTrack) {
    let startX = 0;
    let endX = 0;

    galleryViewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    galleryViewport.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 2. Pricing & Bundle Selector State
  // ==========================================================================
  const bundleCards = document.querySelectorAll('.bundle-card');
  const formPackCards = document.querySelectorAll('.form-pack-card');
  const currentPriceEl = document.getElementById('currentPrice');
  const originalPriceEl = document.getElementById('originalPrice');
  const discountTagEl = document.getElementById('discountTag');
  const stickyPriceEl = document.getElementById('stickyPrice');
  const stickyPackNameEl = document.getElementById('stickyPackName');

  const bundleData = [
    {
      index: 0,
      title: '1 Box (14 Daily Shots)',
      shots: 14,
      price: 899,
      original: 1299,
      discount: '31% की छूट',
      desc: '2 Weeks Blood Sugar Balancing Starter Pack'
    },
    {
      index: 1,
      title: '2 Boxes (28 Daily Shots - 1 Month)',
      shots: 28,
      price: 1599,
      original: 2598,
      discount: '38% की भारी छूट',
      desc: 'Most Popular: Complete 1 Month Blood Sugar Support'
    },
    {
      index: 2,
      title: '4 Boxes (56 Daily Shots - 2 Months)',
      shots: 56,
      price: 2899,
      original: 5196,
      discount: '44% की महा बचत',
      desc: 'Best Value: 2 Months Sustained HbA1c & Pancreatic Care'
    }
  ];

  let selectedBundleIndex = 1; // Default: 2 Boxes (Most Popular)

  function updateBundleState(index) {
    selectedBundleIndex = index;
    const data = bundleData[index];

    // Update Hero UI
    if (currentPriceEl) currentPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (originalPriceEl) originalPriceEl.textContent = `₹${data.original.toLocaleString('en-IN')}`;
    if (discountTagEl) discountTagEl.textContent = data.discount;

    // Update Hero Bundle Cards
    bundleCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Form Pack Cards if present
    formPackCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Sticky Bar
    if (stickyPriceEl) stickyPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (stickyPackNameEl) stickyPackNameEl.textContent = data.title;

    // Update hidden inputs in modal form
    const modalSelectedPack = document.getElementById('modalSelectedPack');
    const modalPrice = document.getElementById('modalPrice');
    if (modalSelectedPack) modalSelectedPack.value = data.title;
    if (modalPrice) modalPrice.value = `₹${data.price.toLocaleString('en-IN')}`;
  }

  bundleCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  formPackCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  // Initialize with index 1 (Most popular)
  updateBundleState(1);

  // ==========================================================================
  // 3. Duplicate Contact Validation (24-Hour Prevention)
  // ==========================================================================
  function cleanPhoneNumber(phone) {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  function checkDuplicateContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return false;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      const timestamp = stored[clean];
      if (timestamp && (Date.now() - timestamp < DUPLICATE_COOLDOWN_MS)) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function saveSubmittedContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      stored[clean] = Date.now();
      localStorage.setItem(SUBMITTED_CONTACTS_KEY, JSON.stringify(stored));
    } catch (e) {}
  }

  const phoneInput = document.getElementById('modalCodPhone');
  const duplicateAlert = document.getElementById('modalDuplicateAlert');

  function validateDuplicateUI() {
    if (!phoneInput) return false;
    const phone = phoneInput.value.trim();
    const isDup = checkDuplicateContact(phone);
    if (duplicateAlert) {
      duplicateAlert.style.display = isDup ? 'block' : 'none';
    }
    return isDup;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', validateDuplicateUI);
    phoneInput.addEventListener('blur', validateDuplicateUI);
  }

  // ==========================================================================
  // 4. Modals Management (Common COD Lead Modal, Thank You Modal, Review Modal)
  // ==========================================================================
  const codModal = document.getElementById('codModal');
  const codModalClose = document.getElementById('codModalClose');
  const thankYouModal = document.getElementById('thankYouModal');
  const thankYouModalClose = document.getElementById('thankYouModalClose');
  const thankYouModalDoneBtn = document.getElementById('thankYouModalDoneBtn');
  const reviewModal = document.getElementById('reviewModal');
  const reviewModalClose = document.getElementById('reviewModalClose');
  const writeReviewBtn = document.getElementById('writeReviewBtn');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Reset duplicate alert when opening modal
    if (modal === codModal && duplicateAlert) {
      duplicateAlert.style.display = 'none';
    }

    const firstInput = modal.querySelector('input:not([type="hidden"])');
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ALL CTA BUTTONS ACROSS THE ENTIRE PAGE TRIGGER THIS COMMON COD MODAL
  const allCtaButtons = document.querySelectorAll(
    '.btn-buy-now, #heroBuyNow, #stickyBuyNow, #navCtaBtn, #sectionCodBuyBtn, .hero-quick-form-btn, .btn-hero-order'
  );

  allCtaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(codModal);
    });
  });

  if (codModalClose) codModalClose.addEventListener('click', () => closeModal(codModal));
  if (thankYouModalClose) thankYouModalClose.addEventListener('click', () => closeModal(thankYouModal));
  if (thankYouModalDoneBtn) thankYouModalDoneBtn.addEventListener('click', () => closeModal(thankYouModal));
  if (reviewModalClose) reviewModalClose.addEventListener('click', () => closeModal(reviewModal));
  if (writeReviewBtn) writeReviewBtn.addEventListener('click', () => openModal(reviewModal));

  // Close modal on overlay background click
  [codModal, thankYouModal, reviewModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [codModal, thankYouModal, reviewModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  // ==========================================================================
  // 5. COD Order Submission (Lead Webhook + 24hr Prevention + Thank You)
  // ==========================================================================
  const modalCodForm = document.getElementById('modalCodForm');

  function generateOrderId() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `MDB-COD-${randomNum}`;
  }

  function handleOrderSuccess(name, phone, address, city, state, packTitle, amount, orderId) {
    // Populate Thank You Modal
    const tyOrderId = document.getElementById('thankYouOrderId');
    const tyCustomerName = document.getElementById('thankYouCustomerName');
    const tyPhone = document.getElementById('thankYouPhone');
    const tyAddress = document.getElementById('thankYouAddress');
    const tyPack = document.getElementById('thankYouPack');
    const tyAmount = document.getElementById('thankYouAmount');
    const waShareBtn = document.getElementById('whatsappConfirmBtn');

    const addressParts = [address, city, state].filter(Boolean);
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'वेरिफिकेशन कॉल पर पता नोट किया जाएगा';
    const cityStateText = [city, state].filter(Boolean).join(', ') || 'Verification Call';

    if (tyOrderId) tyOrderId.textContent = orderId;
    if (tyCustomerName) tyCustomerName.textContent = name || 'प्रिय ग्राहक';
    if (tyPhone) tyPhone.textContent = `+91 ${phone}`;
    if (tyAddress) tyAddress.textContent = formattedAddress;
    if (tyPack) tyPack.textContent = packTitle;
    if (tyAmount) tyAmount.textContent = `₹${amount.toLocaleString('en-IN')}`;

    if (waShareBtn) {
      const waText = encodeURIComponent(
        `नमस्ते Madhavbaug! मैंने Diabomatic Shots का Cash On Delivery आर्डर किया है।\n` +
        `Order ID: ${orderId}\n` +
        `Pack: ${packTitle}\n` +
        `Amount: ₹${amount}\n` +
        `Name: ${name}\n` +
        `Address: ${formattedAddress}\n` +
        `City/State: ${cityStateText}`
      );
      waShareBtn.href = `https://wa.me/919321456789?text=${waText}`;
    }

    closeModal(codModal);
    openModal(thankYouModal);
    showToast('🎉 Cash on Delivery आर्डर दर्ज हो गया है!');
  }

  if (modalCodForm) {
    modalCodForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('modalCodName')?.value.trim() || '';
      const phone = document.getElementById('modalCodPhone')?.value.trim() || '';
      const address = document.getElementById('modalCodAddress')?.value.trim() || '';
      const city = document.getElementById('modalCodCity')?.value.trim() || '';
      const state = document.getElementById('modalCodState')?.value.trim() || '';
      const bundle = bundleData[selectedBundleIndex] || bundleData[1];

      // 1. Check if contact number was already submitted within 24 hours
      if (checkDuplicateContact(phone)) {
        if (duplicateAlert) duplicateAlert.style.display = 'block';
        showToast('⚠️ Already submitted form. Wait for 24hr, our representative will call you.');
        return;
      }

      const submitBtn = document.getElementById('modalSubmitBtn');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '⏳ आर्डर दर्ज हो रहा है...';
        submitBtn.disabled = true;
      }

      const orderId = generateOrderId();
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Lead data payload (address, city, state are optional)
      const leadData = {
        timestamp: now,
        orderId: orderId,
        name: name,
        contact: phone,
        address: address || '-',
        city: city || '-',
        state: state || '-',
        package: bundle.title,
        price: `₹${bundle.price}`,
        paymentMode: 'Cash On Delivery (COD)',
        pageUrl: window.location.href
      };

      // 2. Post to Google Sheets Webhook
      if (GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL.trim() !== '') {
        try {
          await fetch(GOOGLE_SHEETS_WEBHOOK_URL.trim(), {
            method: 'POST',
            mode: 'no-cors', // standard for Google Apps Script Web App
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
          });
          console.log('Lead successfully sent to Google Sheets Webhook:', leadData);
        } catch (err) {
          console.error('Error posting lead to Google Sheets:', err);
        }
      } else {
        console.warn('Google Sheets Webhook URL is empty. Lead recorded locally:', leadData);
      }

      // 3. Mark contact number as submitted for 24 hours
      saveSubmittedContact(phone);

      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }

      modalCodForm.reset();
      handleOrderSuccess(name, phone, address, city, state, bundle.title, bundle.price, orderId);
    });
  }

  // ==========================================================================
  // 6. Toast Notifications
  // ==========================================================================
  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');
  function showToast(message) {
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // ==========================================================================
  // 7. Accordion FAQs
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(other => other.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  // ==========================================================================
  // 8. Sticky Mobile & Desktop Floating Bottom Bar Visibility
  // ==========================================================================
  const stickyBar = document.getElementById('stickyMobileBar');
  const heroSection = document.getElementById('product-hero');

  if (stickyBar && heroSection) {
    window.addEventListener('scroll', () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom < 100) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    });
  }

  // ==========================================================================
  // 9. Customer Review Filters & Sample Review Submit
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  const reviewCards = document.querySelectorAll('.review-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      reviewCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  const sampleReviewForm = document.getElementById('sampleReviewForm');
  if (sampleReviewForm) {
    sampleReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal(reviewModal);
      showToast('धन्यवाद! आपकी समीक्षा सफलतापूर्वक भेज दी गई है।');
      sampleReviewForm.reset();
    });
  }
});
