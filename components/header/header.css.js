import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const scaleSize = (size) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

export const getResponsiveValues = () => {
  return {
    height: Platform.OS === 'ios' ? scaleSize(100) : scaleSize(80),
    logoSize: scaleSize(60),
    iconSize: scaleSize(28),
    padding: scaleSize(16),
  };
};

export const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0C1824',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1824',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    marginRight: 10,
  },
  logo: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    width: '100%',
  },
  notificationText: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 15,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0C1824',
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});