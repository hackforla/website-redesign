# Hack for L.A. Redesign

> **HEY!** Thankis for contributing. We're redesigning the redesign. This is officially the legacy version of the site as we are migrating the project to a VueJS/Nuxt stack. Check out the [hackforla/website](https://github.com/hackforla/website) repo to get involved with that.

## Table of Contents
* [Building the Project](#build)
* [Deployment](#deploy)
* [Content Updates](#content)
* [Technical Details](#tech)
  * [Boilerplate](#tech-boilerplate)
	* [CSS](#tech-css)
	* [JavaScript](#tech-js)
	* [SVG](#tech-svg)
	* [Pug](#tech-pug)
	* [Code Linting and Standards](#tech-standards)

<a name="build"></a>
## Building the Project
If you haven't yet, you'll need to [install node and npm](https://nodejs.org/en/download/). Once those are installed, open up Terminal and navigate to the project root directory.

```
$ cd ~/{{your local path here}}
```

Install the project dependencies. You only need to do this the first time you are setting up the project.

```
$ npm install
```

Once project dependencies are installed, run:

```
$ gulp
```

This will build the project. All compiled files are now available in the `/dist` directory.

For local development you can run the project locally by doing:

```
$ gulp serve
```
A browser window pointed to `http://localhost:3001` will open with [BrowserSync](https://www.browsersync.io/) active. This allows for live reloading of the page as assets (CSS, JS, images) are updated and is useful for synchronous browser testing.

This is more for active development though as not all assets will be fully optimized. To run a full build task and then serve the site locally, you can do:

```
$ gulp serve:dist
```
Which will run a local server at `http://localhost:3002/` served from the `/dist` directory.

<a name="deploy"></a>
## Deploying
The site is continuously deployed by [Netlify](https://www.netlify.com). Whenever a commit is made to the `master` branch of this repository, Netlify runs the build comman (`gulp`) and deploys the contents of `/dist` to its servers.

<a name="content"></a>
## Content Updates
A very simple CMS is available for making site changes built on [NetlifyCMS](https://www.netlifycms.org).

To make site changes, log in to [https://www.hackforla.org/admin](https://www.hackforla.org/admin). You will need to authenticate via Github, and will need write access to this repository.

Content changes are written to a Markdown file that are then committed directly to `master`, which Netlify will then compile, build, and deploy. Since there is a build process involved, changes won't display instantly but will take a couple minutes.

<a name="tech"></a>
## Technical Details

<a name="tech-boilerplate"></a>
### Boilerplate

This project is largely based on the [Web Starter Kit](https://developers.google.com/web/tools/starter-kit/), with some modification to the gulp workflow to add in svg and pug rendering.

<a name="tech-css"></a>
### CSS

Source files for the site's CSS are located in the `/app/styles` directory. The SCSS files are processed, concatenated, and minfied by the `gulp styles` task.

[Bourbon (v4.3.3)](bourbon.io/docs/) is used as a light SCSS mixin library, and browser prefixing is included as a post-processor by the `gulp styles` task. 

<a name="tech-js"></a>
### JavaScript
JavaScript is written in ES6 syntax and Babel is used to translate this into ES5 for browser compatibililty. Furthermore, it is minified all by the `gulp scripts` task. JS is pretty light for this project so it's all contained in `/app/scripts/main.js`.

<a name="tech-svg"></a>
### SVG
SVGs are minified and concatenated into a single sprite file by the `gulp svg-sprites` task. SVGs only need to be added to the `/app/images/_svg-sprite` directory. The rendered svg sprite is then included inline via the `gulp html` task.

<a name="tech-pug"></a>
### Pug
HTML is rendered using [pug](http://pugjs.org) templates via the `gulp html` task. The bulk of the markup for these templates is located in `/app/_layouts` and `/app/_mixins`.	

<a name="tech-standards"></a>
### Code Linting and Standards
An `.editorconfig` file is included to enforce some style settings for code editors that support it. See [editorconfig.com](http://editorconfig.org/) for more information. Furthermore, an eslint task enforces JavaScript style rules, based on [Google's standards](https://google.github.io/styleguide/javascriptguide.xml).
