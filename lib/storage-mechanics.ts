import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageMechanics {

 static async set(key: StorageKeys, value: any ){
  try {
   const jsonValue = JSON.stringify(value);
   await AsyncStorage.setItem(key.toString(), jsonValue);
  } catch (e) {
  }
 }

 static async remove(key: StorageKeys){
   try {
     await AsyncStorage.removeItem(key.toString())
   }catch (e){}
 }

 static async getAllKeys(){
  return await AsyncStorage.getAllKeys();
 }

 static async clear(){
  await AsyncStorage.clear();
 }

 static async get(key: StorageKeys){
  try {
   const jsonValue = await AsyncStorage.getItem(key.toString());
   return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
   // error reading value
  }
 }
}

export enum StorageKeys {
 USER = 'user',
 HAS_ONBOARDING_COMPLETED = 'has-onboarding-completed'
}