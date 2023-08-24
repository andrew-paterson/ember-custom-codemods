# Installation

`npm install git+ssh://git@github.com/andrew-paterson/ember-custom-codemods.git`

# no-implicit-this

Automatically fixes `no-implicit-this` errors in Ember.js applications and addons.

Uses a JSON list of no-implicit this template errors, all referring to properties references in a template with neither `this.` not `@`.

First determines if a property should have the prefix `.this`. Use the components map passed as the second argument to find all of the JavaScript files which back the template in question. The `.this` prefix is applied if any ofn the following are found in any of the JavaScript files backing the template:

- any instances of a computed propery with the same name as the property in question.
- any instances of `x.set('property, ***)` in reference to the property in question.
- any instanes of `x.toggleProperty('property, ***)` in reference to the property in question.
- any instaces of `this.property = ***`

Then, for the remaining errors it takes the array of named properties (Properties preceded by `@`) as the third argument and checks if a property not dealt with above is in that array. If the property is in this array, `@` is added as a prefix.

## Preparing the repo

Update `.templatelintrc` in the repo you're targeting so that the only rule is `no-impllicit-this`, and list all helpers in the `allow` array.

Note- ensure that nothing is extended. Example below.

```
'use strict';

module.exports = {
  rules: {
    'no-implicit-this': {
      allow: [], // Relative paths to all helpers in the ember project, relative to either the addon or app dir.
    },
  },
};
```

[ Optional] Update `.prettierrc` so that the singleQuote rule is not applied to `.hbs` files. Example below.

```
module.exports = {
  singleQuote: true,
  overrides: [
    {
      files: '**/*.hbs',
      options: {
        singleQuote: false,
      },
    },
  ],
};
```

Add these two lines to the `scripts` object ion `package.json`.

`"format:hbs": "prettier **/*.hbs --write",` // Optional
`"lint_implicit_this:hbs": "ember-template-lint ./**/templates --config-path .template-lintrc.js --format=json",`

Then in the terminal

`npm run format:hbs`

`npm run lint_implicit_this:hbs > ${PATH_TO_FILE}.json`

Open the file saved to `${PATH_TO_FILE}.json` and delete the command printed at the top, so that the `JSON` is valid.

### Usage example

```
const createComponentsMap = require('ember-no-implicit-this/create-components-map');
const findNamedArgs = require('ember-no-implicit-this/find-named-args');
const pathToProject = '/home/paddy/development/ember-addons/ember-interactive-table';
const processNoImplicitThis = require('ember-no-implicit-this/process-no-implicit-this');

const componentsMap = createComponentsMap(pathToProject);
const namedArgs = findNamedArgs([pathToProject]); // Create an array of all properties passed as named args, eg @property="***". Include paths to any projects that might use any template in the targerted Ember project.
const noImplicitThisLintResult = require('${PATH_TO_FILE}.json'); // File created when running the template linter above
processNoImplicitThis(pathToProject, componentsMap, namedArgs, noImplicitThisLintResult);
```

# did-insert as modifier

Chnages `didInsertElement` to an action named `didInsert`, with the required `did-insert` modifier in the template.

Example

```
const pathToProject = '/home/paddy/hyraxbio/hyrax-admin-ui';
const didInsertAsModifer = require('ember-custom-codemods/did-insert-as-modifier');

didInsertAsModifer(pathToProject);
```

# no-implicit-injections

Pass it the path to the project to target, and an array of service names. Find templates where those service names appear in the form `{servicename.` or `(servicename.`.

If the asssociated service injection is not at the top of the file, it is added.

Example

````const pathToProject = '/home/paddy/hyraxbio/hyrax-admin-ui';
const noImplicitInjections = require('ember-custom-codemods/no-implicit-injections');

noImplicitInjections(pathToProject, ['store', 'session', 'router', 'flashMessages']);```
````

# no-general-computed

To address the `deprecated-run-loop-and-computed-dot-access` deprecation.

Converts `nonMatchedSamples: computed.filterBy(` to `nonMatchedSamples: filterBy(`.

Adds he required import:

`import { filterBy } from '@ember/object/computed';`

You must pass the path to the project as the forst arg, adn an array of all the child properties of computed that you would like to target.

Example

```
const pathToProject = '/home/paddy/hyraxbio/exatype-ngs-ui';
const noGeneralComputed = require('ember-custom-codemods/no-general-computed');

noGeneralComputed(pathToProject, ['or', 'reads', 'gt', 'filterBy', 'equal']);
```
