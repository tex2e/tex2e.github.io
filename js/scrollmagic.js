
document.addEventListener('DOMContentLoaded', function () {

  // Init ScrollMagic
  var controller = new ScrollMagic.Controller();

  // get all slides
  var slides = ["#slide01", "#slide02", "#slide03"];

  // get all headers in slides that trigger animation
  var slideHeaders = ["#slide01 header", "#slide02 header", "#slide03 header"];

  // get all sections
  var sections = [
    "#section_intro", "#section_works", "#section_skills",
    "#section_langs", "#section_environment",
    "#section_learned_langs", "#section_contact"
  ];

  // Enable ScrollMagic only for desktop, disable on touch and mobile devices
  if (Modernizr.touch) return;

  function format(number) {
    var width = 2;
    var padlen = width - (number + "").length;
    var padstr = "";
    for (var i = 0; i < padlen; i++) {
      padstr += "0"
    }
    return padstr + number;
  }

  // SCENE 1
  // create scenes for each of the headers
  slideHeaders.forEach(function (slideHeader, index) {

    // number for highlighting scenes
    var num = index + 1;

    // make scene
    var slideHeaderScene = new ScrollMagic.Scene({
        triggerElement: slideHeader,
        offset: -95 // offset triggers the animation 95 earlier then middle of the viewport, adjust to your liking
    })
    .setClassToggle('#slide'+format(num), 'is-active') // set class to active slide
    // .addIndicators() // add indicators (requires plugin), use for debugging
    .addTo(controller);
  });

  // SCENE 2
  // change color of the nav for dark content blocks
  sections.forEach(function (section, index) {

    // number for highlighting scenes
    var sectionID = $(section).attr('id');

    // make scene
    var breakScene = new ScrollMagic.Scene({
        triggerElement: section,
        triggerHook: 0.75
    })
    .setClassToggle('#'+sectionID, 'is-active') // set class to active slide
    .addTo(controller);
  });

  // SCENE 4 - parallax effect on each of the slides with bcg
  // move bcg container when slide gets into the view
  slides.forEach(function (slide, index) {

    var $bcg = $(slide).find('.bcg');

    var slideParallaxScene = new ScrollMagic.Scene({
      triggerElement: slide,
      triggerHook: 1,
      duration: "100%"
    })
    .setTween(TweenMax.from($bcg, 1, {y: '-40%', autoAlpha: 0.6, ease:Power0.easeNone}))
    .addTo(controller);
  });

  // SCENE 5 - parallax effect on the intro slide
  // move bcg container when intro gets out of the the view
  var introTl = new TimelineMax();

  introTl
    .to($('#intro .bcg'), 1.4, {y: '20%', ease:Power1.easeOut}, '-=0.2')
    .to($('#intro'), 0.7, {autoAlpha: 0.8, ease:Power1.easeNone}, '-=1.4');

  var introScene = new ScrollMagic.Scene({
    triggerElement: '#intro',
    triggerHook: 0,
    duration: "100%"
  })
  .setTween(introTl)
  .addTo(controller);

  // change behaviour of controller to animate scroll instead of jump
  controller.scrollTo(function (newpos) {
    TweenMax.to(window, 1, {scrollTo: {y: newpos}, ease:Power1.easeInOut});
  });

  // bind scroll to anchor links
  $(document).on("click", "a[href^='#']", function (e) {
    var id = $(this).attr("href");
    if ($(id).length > 0) {
      e.preventDefault();

      // trigger scroll
      controller.scrollTo(id);

      // if supported by the browser we can even update the URL.
      if (window.history && window.history.pushState) {
        history.pushState("", document.title, id);
      }
    }
  });

});
