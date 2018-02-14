# nio-annotate

## Installation

```bash
$ npm install -g niolabs/nio-annotate-cli
```

## Usage

```text
  Usage: nio-annotate.sh [options] [command]

  A CLI tool for managing nio service annotations


  Options:

    -V, --version       output the version number
    -a, --auth <basic>  auth (default: Admin:Admin)
    -h, --host <host>   nio host (default: http://127.0.0.1:8181)
    -v, --verbose
    -h, --help          output usage information


  Commands:

    list|ls [options]                 list service annoations
    add [options]                     add a new annotation
    update [options]                  update an annotation meta
    set-content|set [options] <file>  set an annotation content
    show|cat [options]                show a single annotation
    delete|rm [options]               remove an annotation
    clear [options]                   clear all annotations
  ```
