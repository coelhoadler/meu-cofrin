import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CompanyProfile_Key {
  id: UUIDString;
  __typename?: 'CompanyProfile_Key';
}

export interface CreateCompanyProfileData {
  companyProfile_insert: CompanyProfile_Key;
}

export interface CreateCompanyProfileVariables {
  nomeFantasia: string;
  cnpj: string;
}

export interface GetCompanyProfileData {
  companyProfiles: ({
    id: UUIDString;
    nomeFantasia: string;
    cnpj: string;
    createdAt: TimestampString;
  } & CompanyProfile_Key)[];
}

interface CreateCompanyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCompanyProfileVariables): MutationRef<CreateCompanyProfileData, CreateCompanyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCompanyProfileVariables): MutationRef<CreateCompanyProfileData, CreateCompanyProfileVariables>;
  operationName: string;
}
export const createCompanyProfileRef: CreateCompanyProfileRef;

export function createCompanyProfile(vars: CreateCompanyProfileVariables): MutationPromise<CreateCompanyProfileData, CreateCompanyProfileVariables>;
export function createCompanyProfile(dc: DataConnect, vars: CreateCompanyProfileVariables): MutationPromise<CreateCompanyProfileData, CreateCompanyProfileVariables>;

interface GetCompanyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCompanyProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCompanyProfileData, undefined>;
  operationName: string;
}
export const getCompanyProfileRef: GetCompanyProfileRef;

export function getCompanyProfile(options?: ExecuteQueryOptions): QueryPromise<GetCompanyProfileData, undefined>;
export function getCompanyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCompanyProfileData, undefined>;

