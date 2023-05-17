Add this tot he `scripts` object ion `package.json`

`"lint_implicit_this:hbs": "ember-template-lint --no-config-path ./addon/templates --rule 'no-implicit-this:error' --no-inline-config --format=json",`

Then in the terminal

`npm run lint_implicit_this:hbs > ${PATH_TO_FILE}.json`

Open the file saved to ${PATH_TO_FILE}.json and delete the command printed at the top.
