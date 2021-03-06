/*global require*/

require.config({
    shim: {
    },

    paths: {
		tweenlite: 'vendor/greensock/TweenLite',
	    timelinelite: 'vendor/greensock/TimelineLite',
	    tweenmax: 'vendor/greensock/TweenMax',
	    timelinemax: 'vendor/greensock/TimelineMax',
		snapplugin: 'vendor/greensock/plugins/SnapPlugin',
        snap: 'vendor/snap.svg/dist/snap.svg'
    }
});

require(['app']);
