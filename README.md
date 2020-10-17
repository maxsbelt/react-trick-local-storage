# React Trick Local Storage &middot; [![npm version](https://img.shields.io/npm/v/react-trick-local-storage.svg?style=flat-square)](https://www.npmjs.com/package/react-trick-local-storage) [![build status](https://travis-ci.org/maxsbelt/react-trick-local-storage.svg?branch=master)](https://travis-ci.org/maxsbelt/react-trick-local-storage) [![Coverage Status](https://coveralls.io/repos/github/maxsbelt/react-trick-local-storage/badge.svg?branch=master)](https://coveralls.io/github/maxsbelt/react-trick-local-storage?branch=master) [![Dependencies](https://img.shields.io/david/maxsbelt/react-trick-local-storage.svg)](https://david-dm.org/maxsbelt/react-trick-local-storage) [![DevDependencies](https://img.shields.io/david/dev/maxsbelt/react-trick-local-storage.svg)](https://david-dm.org/maxsbelt/react-trick-local-storage?type=dev)

> Keep list of data as single local storage value and use it with react.

## Installation

```sh
npm install react-trick-local-storage --save
```

## Usage

Create storage in separate file:

```ts
import { createStorage } from 'react-trick-local-storage';

interface Fields {
  accessToken: string | undefined;
}

export const storage = createStorage<Fields>(
  key: 'my-app-storage-key',
);
```

Import storage in your react component:

```tsx
import { useStorageValues } from 'react-trick-local-storage';
import { storage } from './storage';

const App: React.FC = () => {
  const [accessToken] = useStorageValues(storage, 'accessToken');

  if (accessToken) {
    return <div>Authorized</div>;
  }

  return (
    <div>
      <button onClick={() => storage.set('accessToken', 'access-token')}>
        Set access token
      </button>
    </div>
  )
}

```

## Developer Quick Start

Project is build with [tsdx](https://github.com/formium/tsdx) CLI utility.

#### Node

See node installation requirements here (you need node v14.x.x):
https://gist.github.com/maxsbelt/a401dd0c3da8b0e1d50c9eebd2eccf65

#### Editor config

In order to prevent some problems in source files related to different platforms [`.editorconfig`](https://editorconfig.org/) file is located in the root of the project. Please install plugin for your IDE/text editor.
