/* eslint-env browser */
import autosize from 'autosize';
import jquery from 'jquery';
import _ from 'underscore';
import 'jquery.scrollto';

(function($) {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      /* eslint-disable no-console */
      console.error('Error during service worker registration:', e);
      /* eslint-enable no-console */
    });
  }

  // Your custom JavaScript goes here
  const $body = $('body');

  $body.on('click', '.js-smooth-scroll', _.debounce(e => {
    e.preventDefault();
    const hash = $(e.currentTarget).attr('href');
    const $scrollTarget = $(hash);
    $(window).scrollTo($scrollTarget, {
      duration: 300,
      offset: window.matchMedia('(min-width: 768px)').matches ?
          -($('.main-header').outerHeight()) : 0
    });
  }, 200, true)).on('click', '.js-toggle-nav', _.debounce(e => {
    $(e.currentTarget).blur();
    $('body').toggleClass('nav-active');
  }, 200, true));

  $(window).on('scroll', () => {
    if (document.body.scrollTop === 0) {
      $body.addClass('scroll-top');
    } else {
      $body.removeClass('scroll-top');
    }
  });

  $('.js-ajax-form').on('submit', e => {
    e.preventDefault();
    const $form = $(e.currentTarget);

    if ($form.data('loading')) {
      return false;
    }
    $form.data('loading', true);
    /* eslint-disable quote-props*/
    // First we're going to submit the email signup to the Action Network API.
    // Then we're going to submit the form to the Netlify form handler..
    $.ajax({
      url: 'https://actionnetwork.org/api/v2/people/',
      type: 'POST',
      data: JSON.stringify({
        'person': {
          'email_addresses': [{
            'address': $form.find('[name="email"]').val()
          }]
        }
      }),
      headers: {
        'OSDI-API-Token': '6ff91ed1255d1966758bf3449043077a',
        'Content-Type': 'application/json'
      },
      dataType: 'json'
    }).then(() => $.post($form.attr('action'), $form.serialize())
    ).then(() => {
      $form.find('.form-confirmation').removeClass('hidden');
    }).always(() => {
      $form.data('loading', false);
    });
    /* eslint-enable quote-props*/
  });

  autosize($('textarea'));
})(jquery);
