import React, { useEffect, useState, useRef } from 'react';
import { 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  RefreshControl,
  Animated 
} from 'react-native';
import Header from '../components/header';
import Overlay from '../components/overlay';
import FancyBackground from '../styles/FancyBackground';
import { Ionicons } from '@expo/vector-icons';

const PROMOS = [
  {
    title: 'Internet Promo',
    description: 'Unlock Exclusive Deals! – Limited Time Only!',
    image: require('../../../../assets/images/promo.png'),
    endDate: '2025-12-16T23:59:59',
    isActive: true,
  },
  {
    title: 'Raffle',
    description: 'Get a chance to WIN in our Wi-Fi Raffle Promo!',
    image: require('../../../../assets/images/raffle.png'),
    endDate: '2025-12-19T23:59:59',
    isActive: true,
  },
  {
    title: 'Plans Promo',
    description: 'Unlock Exclusive Deals! – Limited Time Only!',
    image: require('../../../../assets/images/plans.png'),
    endDate: '2025-11-16T23:59:59',
    isActive: false,
  },
];

const Promo = () => {
  const [countdowns, setCountdowns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Format time since last refresh
  const formatTimeSinceRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefresh) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  };

  // Update countdowns
  const updateCountdowns = () => {
    const now = new Date().getTime();
    const newCountdowns = PROMOS.map((promo) => {
      const end = new Date(promo.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) return 'EXPIRED';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });
    setCountdowns(newCountdowns);
  };

  useEffect(() => {
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle pull to refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    // Simulate fetching new data
    try {
      // In a real app, you would fetch new promo data here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset countdowns
      updateCountdowns();
      setLastRefresh(new Date());
      
      setRefreshing(false);
    } catch (error) {
      console.error('Refresh error:', error);
      setRefreshing(false);
    }
  }, []);

  // Manual refresh function
  const handleManualRefresh = () => {
    if (refreshing) return;
    
    // Scroll to top if needed
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    // Trigger refresh
    onRefresh();
  };

  // Scroll to top function
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
      <View style={styles.container}>
        <Header />
        <Overlay />

        <View style={styles.contentContainer}>
         
          

          <Animated.ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#00afa1ff']}
                tintColor="#00afa1ff"
                title="Pull to refresh promos"
                titleColor="#00afa1ff"
                progressBackgroundColor="#fff"
              />
            }
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Promo</Text>
              {refreshing && (
                <View style={styles.refreshingIndicator}>
                  <Ionicons name="sync" size={16} color="#00afa1ff" style={styles.refreshingSpinner} />
                  <Text style={styles.refreshingText}>Updating promos...</Text>
                </View>
              )}
            </View>

            {PROMOS.map((promo, index) => (
              <View style={[
                styles.promoCardContainer,
                refreshing && styles.promoCardRefreshing
              ]} key={index}>
                <View style={styles.promoCard}>
                  <Image
                    source={promo.image}
                    style={styles.promoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>{promo.title}</Text>
                    <Text style={styles.promoDescription}>{promo.description}</Text>
                    <View style={styles.promoDetails}>
                      <View style={styles.timerContainer}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.timerText}>
                          Ends in: {countdowns[index]}
                        </Text>
                      </View>
                      <Text style={promo.isActive ? styles.activeStatus : styles.inactiveStatus}>
                        {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={[
              styles.plansContainer,
              refreshing && styles.plansContainerRefreshing
            ]}>
              <View style={styles.plansHeader}>
                <Text style={styles.plansTitle}>WORK-RELIABLE PLAN</Text>
                <Ionicons name="flash" size={20} color="#00afa1ff" />
              </View>
              
              <View style={styles.planRow}>
                {['995','1495','1695','1995','2495'].map((price, idx) => (
                  <TouchableOpacity 
                    style={[
                      styles.planBox,
                      refreshing && styles.planBoxRefreshing
                    ]} 
                    key={idx}
                    disabled={refreshing}
                  >
                    <Text style={styles.planPrice}>PLAN {price}</Text>
                    <Text style={styles.planSpeed}>{['15','35','50','75','100'][idx]}Mbps</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.freeInstallation}>
                <Ionicons name="checkmark-circle" size={18} color="#00afa1ff" /> 
                FREE INSTALLATION!!!
              </Text>
            </View>

            {/* Pull to refresh hint */}
            {!refreshing && (
              <View style={styles.pullHint}>
                <Ionicons name="arrow-down" size={16} color="#999" />
                <Text style={styles.pullHintText}>Pull down to refresh</Text>
              </View>
            )}

            {/* Scroll to top button */}
            <Animated.View style={[
              styles.scrollToTopButton,
              {
                opacity: scrollY.interpolate({
                  inputRange: [0, 100, 200],
                  outputRange: [0, 0.5, 1],
                  extrapolate: 'clamp',
                }),
                transform: [{
                  translateY: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [50, 0],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}>
              <TouchableOpacity 
                style={styles.scrollToTopTouchable}
                onPress={scrollToTop}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-up" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.ScrollView>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
  },
  // Refresh Indicator
  refreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  refreshInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00afa1ff',
    marginLeft: 10,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#00afa1ff',
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshingButtonText: {
    color: '#00afa1ff',
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000ff',
    textAlign: 'center',
    marginBottom: 10,
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  refreshingSpinner: {
    marginRight: 8,
  },
  refreshingText: {
    fontSize: 14,
    color: '#00afa1ff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  promoCardContainer: {
    marginBottom: 20,
  },
  promoCardRefreshing: {
    opacity: 0.8,
  },
  promoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promoImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  promoContent: {
    padding: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  promoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00afa1ff',
    backgroundColor: '#e0f7f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inactiveStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b6b',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  plansContainer: {
    paddingVertical: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  plansContainerRefreshing: {
    opacity: 0.8,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  planBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00afa1ff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  planBoxRefreshing: {
    opacity: 0.7,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00afa1ff',
    marginBottom: 8,
  },
  planSpeed: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  freeInstallation: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00afa1ff',
    textAlign: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pull to refresh hint
  pullHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
     backgroundColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  pullHintText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  // Scroll to top button
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  scrollToTopTouchable: {
    backgroundColor: '#00afa1ff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Promo;