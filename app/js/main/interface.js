'use strict';

const Interface = {
    // USERINTERACTION: on "browse" button click, invoke hidden input action
    browse: (type) => {
        console.info('Opening File Browser');
        document.querySelector('#' + type + '-file-path-hidden').click();
    },

    // AUTO: from lib/trakt
    traktLogin: (poll) => {
        Misc.openExternal(poll.verification_url);
        win.focus();
        $('#traktAuth, #traktinit a').hide();
        $('#traktinit p').text(i18n.__('Enter the code below in your browser'));
        $('#traktCode').val(poll.user_code).show();
    },

    // AUTO: from lib/trakt or boot
    traktConnected: (info) => {
        $('#traktinit').hide();
        $('#traktwelcome').show();

        if (info) {
            //console.log('trakt welcome from db');
            $('#welcomeprofile .welcomemessage').text(i18n.__('Welcome back'));
            $('#welcomeprofile img').attr('src', info.images.avatar.full);
            $('#welcomeprofile .username').text(info.username);
        } else {
            //console.log('trakt welcome from GET profile')
            Trakt.client.users.profile({
                username: 'me',
                extended: 'full'
            }).then(profile => {
                DB.store(profile, 'trakt_profile');
                $('#welcomeprofile .welcomemessage').text(i18n.__('Welcome'));
                $('#welcomeprofile img').attr('src', profile.images.avatar.full);
                $('#welcomeprofile .username').text(profile.username);
            })
        }
        $('#welcomeprofile').show();
        $('#traktwelcome .spinner').show();
    },

    // AUTO: from welcome page
    showMain: () => {
        $('#traktwelcome').hide();
        $('#collection').show();
        $('#navbar').show();
    },

    // USER INTERACTION: click navbar
    showMovies: () => {
        $('#navbar .nav').removeClass('active');
        $('#collection #movies').show();
        $('#collection #shows').hide();
        $('#collection #locals').hide();
        $('#settings').hide();
        $('#navbar .movies').addClass('active');
        window.scrollTo(0,0);
    },
    // USER INTERACTION: click navbar
    showShows: () => {
        $('#navbar .nav').removeClass('active');
        $('#collection #shows').show();
        $('#collection #movies').hide();
        $('#collection #locals').hide();
        $('#settings').hide();
        $('#navbar .shows').addClass('active');
        window.scrollTo(0,0);
    },
    // USER INTERACTION: click navbar
    showLocals: () => {
        $('#navbar .nav').removeClass('active');
        $('#collection #locals').show();
        $('#collection #shows').hide();
        $('#collection #movies').hide();
        $('#settings').hide();
        $('#navbar .locals').addClass('active');
        $('#locals .categories').show();
        $('#locals .items').hide();
        window.scrollTo(0,0);
    },
    // USER INTERACTION: click navbar
    showSettings: () => {
        $('#navbar .nav').removeClass('active');
        $('#settings').show();
        $('#collection #shows').hide();
        $('#collection #locals').hide();
        $('#collection #movies').hide();
        $('#navbar .settings').addClass('active');
        window.scrollTo(0,0);
    },

    // USER INTERACTION: click trailer item button
    playTrailer: (url) => {
        let ytc = url.split('=')[1];
        let iframe = $('<iframe>')
            .attr('src', `http://www.youtube.com/embed/${ytc}?autoplay=1`)
            .attr('frameborder', '0')
            .attr('allowfullscreen', '1')
            .css({'width': 640, 'height':360});

        $('#trailer .video').append(iframe);
        $('#trailer').show();
    },
    // USER INTERACTION: click out of the trailer popup
    closeTrailer: () => {
        $('#trailer').hide();
        $('#trailer .video').html('');
    },

    locals: {
        // USER INTERACTION: click show
        showSeasons: (id) => {
            let opened = $(`#${id}`).hasClass('active');

            $('#locals .local-item').removeClass('active');
            $('#locals .seasons').hide();

            if (opened) return;
            $(`#${id}`).addClass('active');
            $(`#${id} .seasons`).show();
        },
        // USER INTERACTION: click season
        showEpisodes: (id, s) => {
            event.stopPropagation();
            let opened = $(`#${id} .s${s}`).hasClass('active');

            $(`#${id} .season`).removeClass('active');
            $(`#${id} .episode`).hide();

            if (opened) return;
            $(`#${id} .s${s}`).addClass('active');
            $(`#${id} .s${s} .episode`).show();
        },
        // USER INTERACTION: click one of the local categories
        show: (cl) => {
            $(`#locals .${cl}`).show();
            $('#locals .categories').hide();
        }
    },

    addLocalPath: () => {
        document.querySelector('#hidden-input-local').click();
    },
    removeLocalPath: () => {
        let selected = $('#settings .locals .option .paths li.selected');
        if (!selected.length) return;
        Local.removePath(selected.text());
    },

    switchCollectionSize: (wasBig) => {
        console.info('Switching items size to %s items per row', wasBig ? '3' : '2');

        let size = {
            from: wasBig ? 6 : 4,
            to: wasBig ? 4 : 6
        }

        $(`.col-sm-${size.from}`).addClass(`col-sm-${size.to}`).removeClass(`col-sm-${size.from}`);
    }
};