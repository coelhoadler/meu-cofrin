# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCompanyProfile*](#getcompanyprofile)
- [**Mutations**](#mutations)
  - [*CreateCompanyProfile*](#createcompanyprofile)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@meu-cofrin/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@meu-cofrin/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@meu-cofrin/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCompanyProfile
You can execute the `GetCompanyProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getCompanyProfile(options?: ExecuteQueryOptions): QueryPromise<GetCompanyProfileData, undefined>;

interface GetCompanyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCompanyProfileData, undefined>;
}
export const getCompanyProfileRef: GetCompanyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCompanyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCompanyProfileData, undefined>;

interface GetCompanyProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetCompanyProfileData, undefined>;
}
export const getCompanyProfileRef: GetCompanyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCompanyProfileRef:
```typescript
const name = getCompanyProfileRef.operationName;
console.log(name);
```

### Variables
The `GetCompanyProfile` query has no variables.
### Return Type
Recall that executing the `GetCompanyProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCompanyProfileData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCompanyProfileData {
  companyProfiles: ({
    id: UUIDString;
    nomeFantasia: string;
    cnpj: string;
    createdAt: TimestampString;
  } & CompanyProfile_Key)[];
}
```
### Using `GetCompanyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCompanyProfile } from '@meu-cofrin/dataconnect';


// Call the `getCompanyProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCompanyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCompanyProfile(dataConnect);

console.log(data.companyProfiles);

// Or, you can use the `Promise` API.
getCompanyProfile().then((response) => {
  const data = response.data;
  console.log(data.companyProfiles);
});
```

### Using `GetCompanyProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCompanyProfileRef } from '@meu-cofrin/dataconnect';


// Call the `getCompanyProfileRef()` function to get a reference to the query.
const ref = getCompanyProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCompanyProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.companyProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.companyProfiles);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCompanyProfile
You can execute the `CreateCompanyProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createCompanyProfile(vars: CreateCompanyProfileVariables): MutationPromise<CreateCompanyProfileData, CreateCompanyProfileVariables>;

interface CreateCompanyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCompanyProfileVariables): MutationRef<CreateCompanyProfileData, CreateCompanyProfileVariables>;
}
export const createCompanyProfileRef: CreateCompanyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCompanyProfile(dc: DataConnect, vars: CreateCompanyProfileVariables): MutationPromise<CreateCompanyProfileData, CreateCompanyProfileVariables>;

interface CreateCompanyProfileRef {
  ...
  (dc: DataConnect, vars: CreateCompanyProfileVariables): MutationRef<CreateCompanyProfileData, CreateCompanyProfileVariables>;
}
export const createCompanyProfileRef: CreateCompanyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCompanyProfileRef:
```typescript
const name = createCompanyProfileRef.operationName;
console.log(name);
```

### Variables
The `CreateCompanyProfile` mutation requires an argument of type `CreateCompanyProfileVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCompanyProfileVariables {
  nomeFantasia: string;
  cnpj: string;
}
```
### Return Type
Recall that executing the `CreateCompanyProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCompanyProfileData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCompanyProfileData {
  companyProfile_insert: CompanyProfile_Key;
}
```
### Using `CreateCompanyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCompanyProfile, CreateCompanyProfileVariables } from '@meu-cofrin/dataconnect';

// The `CreateCompanyProfile` mutation requires an argument of type `CreateCompanyProfileVariables`:
const createCompanyProfileVars: CreateCompanyProfileVariables = {
  nomeFantasia: ..., 
  cnpj: ..., 
};

// Call the `createCompanyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCompanyProfile(createCompanyProfileVars);
// Variables can be defined inline as well.
const { data } = await createCompanyProfile({ nomeFantasia: ..., cnpj: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCompanyProfile(dataConnect, createCompanyProfileVars);

console.log(data.companyProfile_insert);

// Or, you can use the `Promise` API.
createCompanyProfile(createCompanyProfileVars).then((response) => {
  const data = response.data;
  console.log(data.companyProfile_insert);
});
```

### Using `CreateCompanyProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCompanyProfileRef, CreateCompanyProfileVariables } from '@meu-cofrin/dataconnect';

// The `CreateCompanyProfile` mutation requires an argument of type `CreateCompanyProfileVariables`:
const createCompanyProfileVars: CreateCompanyProfileVariables = {
  nomeFantasia: ..., 
  cnpj: ..., 
};

// Call the `createCompanyProfileRef()` function to get a reference to the mutation.
const ref = createCompanyProfileRef(createCompanyProfileVars);
// Variables can be defined inline as well.
const ref = createCompanyProfileRef({ nomeFantasia: ..., cnpj: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCompanyProfileRef(dataConnect, createCompanyProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.companyProfile_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.companyProfile_insert);
});
```

