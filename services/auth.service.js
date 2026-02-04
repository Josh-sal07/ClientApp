// services/auth.service.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthService = {
  async getAuthState() {
    const [phone, token, pinSet] = await Promise.all([
      AsyncStorage.getItem('phone'),
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('pin_set')
    ]);
    
    return { phone, token, pinSet: pinSet === 'true' };
  },
  
  async saveLoginData(phone, token) {
    await AsyncStorage.multiSet([
      ['phone', phone],
      ['token', token],
      ['pin_set', 'true'],
      [`pin_set_${phone}`, 'true']
    ]);
  },
  
  async clearAuthData() {
    const phone = await AsyncStorage.getItem('phone');
    const keysToRemove = ['phone', 'token', 'pin_set', 'temp_phone'];
    
    if (phone) {
      keysToRemove.push(`pin_set_${phone}`);
    }
    
    await AsyncStorage.multiRemove(keysToRemove);
  },
  
  async isAuthenticated() {
    const { phone, token } = await this.getAuthState();
    return !!(phone && token);
  }
};