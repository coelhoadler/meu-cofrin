# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createCompanyProfile, getCompanyProfile } from '@meu-cofrin/dataconnect';


// Operation CreateCompanyProfile:  For variables, look at type CreateCompanyProfileVars in ../index.d.ts
const { data } = await CreateCompanyProfile(dataConnect, createCompanyProfileVars);

// Operation GetCompanyProfile: 
const { data } = await GetCompanyProfile(dataConnect);


```