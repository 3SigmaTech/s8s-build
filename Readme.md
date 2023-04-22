# Creates assorted Gulp tasks for use in S8S projects

| Task Name | Description |
| --------- | ----------- |
| `vendorjs` | Builds Typescript in `./vendor` folder into `./build/js/vendor.js` and `./dist/js/vendor.js` |
| `js` | Builds Typescript in `./public` |
| `visualizejs` | Same as `js`, but creates Rollup visual. |
| `css` | Builds Sass (`*.scss`) and CSS files in `./public` |
| `statics` | Copies `./public/img` (skips `./public/img/Unused`), `./public/fonts`, and `./public/data` files to build and dist folders (maintaining folder structure). |
| `serverbuild` | Builds Typescript in `./app` |
| `frontbuild` | Runs `vendorjs + js + css + statics` |
| `build` | Runs `frontbuild + serverbuild` |
| `dev` | Runs `clean + build` and two un-exposed tasks: `watch` (which uses `browser-sync`) and `devserver` (which uses `nodemon`). These two tasks run the appropriate sub-task to rebuild the resource, then auto-refresh the browser. |
| `release` | Run `clean + incrementVersion + build` |
| `incrementVersion` | **USE WITH EXTREME CAUTION** <br/> Increments the patch version number - e.g. updates `0.1.2` to `0.1.3`. This task will update the `./app/app.ts` file, the `./package.json` file, and create a new Git Tag. |
| `clean` | Removes the `./build`, `./dist`, and `./server` directories. |
| `makeprivateflows` | **Use Once** <br/> Creates Github workflow file to create a release from a tag. |
| `makepublicflows` | **Use Once** <br/> Creates Github workflow file to create a package from a release. (Also ships a shell script to create local packages.) |

## Task Tree

```
 ├─┬ build
 │ └─┬ <series>
 │   ├─┬ <parallel>
 │   │ ├── vendorjs
 │   │ ├── js
 │   │ ├── css
 │   │ └── statics
 │   └── serverbuild
 ├── clean
 ├── css
 ├─┬ dev
 │ └─┬ <series>
 │   ├── clean
 │   ├─┬ <parallel>
 │   │ ├── vendorjs
 │   │ ├── js
 │   │ ├── css
 │   │ └── statics
 │   └─┬ <parallel>
 │     ├── _watch
 │     └── _devserver
 ├─┬ frontbuild
 │ └─┬ <parallel>
 │   ├── vendorjs
 │   ├── js
 │   ├── css
 │   └── statics
 ├── js
 ├─┬ makeprivateflows
 │ └─┬ <series>
 │   └── makeReleaseFlow
 ├─┬ makepublicflows
 │ └─┬ <series>
 │   └── makePackageFlow
 ├─┬ release
 │ └─┬ <series>
 │   ├── clean
 │   ├── increment
 │   └─┬ <series>
 │     ├─┬ <parallel>
 │     │ ├── vendorjs
 │     │ ├── js
 │     │ ├── css
 │     │ └── statics
 │     └── serverbuild
 ├── serverbuild
 ├── statics
 ├── vendorjs
 └── visualizejs
```

# Usage


# TODO
- Replace `gulp-git` with in-house written package. (It is effective, but doesn't have types and is overpowered for what I need.)
- Add task for initializing assorted `.ignore` files.
- Improve `paths.paths` construct. Ideally create three separate, fully fleshed out paths objects - one for front+back-end, one for front-end, and one for back-end.
- Account for `*.d.ts` files (add to dist if we're rendering declaration maps)
