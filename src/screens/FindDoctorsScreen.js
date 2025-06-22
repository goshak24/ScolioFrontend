import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  ScrollView, 
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import ReusableSearchBar from '../components/reusable/ReusableSearchBar';

const FindDoctorsScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedView, setSelectedView] = useState('list'); // 'map' or 'list'

  // Sample doctor data
  const doctors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Orthopedic Surgeon',
      rating: 4.8,
      reviewCount: 124,
      distance: '1.2 miles',
      image: null, // placeholder for doctor image
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Physiotherapist',
      rating: 4.9,
      reviewCount: 89,
      distance: '0.8 miles',
      image: null,
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Sports Medicine',
      rating: 4.7,
      reviewCount: 156,
      distance: '2.1 miles',
      image: null,
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      specialty: 'Orthopedic Surgeon',
      rating: 4.6,
      reviewCount: 92,
      distance: '1.8 miles',
      image: null,
    },
    {
      id: '5',
      name: 'Dr. Lisa Thompson',
      specialty: 'Physical Therapy',
      rating: 4.9,
      reviewCount: 203,
      distance: '0.5 miles',
      image: null,
    },
  ];

  // Filter doctors based on search text
  const filteredDoctors = useMemo(() => {
    if (!searchText.trim()) {
      return doctors;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    return doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(searchLower) ||
      doctor.specialty.toLowerCase().includes(searchLower)
    );
  }, [searchText]);

  const handleSearchChange = (text) => {
    setSearchText(text);
  };

  const handleSearchClear = () => {
    setSearchText('');
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons 
          key={`full-${i}`} 
          name="star" 
          size={moderateScale(12)} 
          color={COLORS.accentOrange} 
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons 
          key="half" 
          name="star-half" 
          size={moderateScale(12)} 
          color={COLORS.accentOrange} 
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons 
          key={`empty-${i}`} 
          name="star-outline" 
          size={moderateScale(12)} 
          color={COLORS.lightGray} 
        />
      );
    }

    return stars;
  };

  const renderDoctorCard = (doctor) => (
    <TouchableOpacity key={doctor.id} style={styles.doctorCard}>
      <View style={styles.doctorInfo}>
        <View style={styles.doctorImageContainer}>
          <View style={styles.doctorImagePlaceholder}>
            <Ionicons 
              name="person" 
              size={moderateScale(24)} 
              color={COLORS.lightGray} 
            />
          </View>
        </View>
        
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(doctor.rating)}
            </View>
            <Text style={styles.ratingText}>
              {doctor.rating} ({doctor.reviewCount})
            </Text>
          </View>
        </View>
        
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>{doctor.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderNoResults = () => (
    <View style={styles.noResultsContainer}>
      <Ionicons 
        name="search-outline" 
        size={moderateScale(48)} 
        color={COLORS.lightGray} 
      />
      <Text style={styles.noResultsTitle}>No doctors found</Text>
      <Text style={styles.noResultsText}>
        Try searching for a different name or specialty
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.darkBackground} 
        translucent={false} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Find Doctors</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={moderateScale(22)} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={{ marginHorizontal: moderateScale(10) }}>
        <ReusableSearchBar 
          placeholder="Search doctors, specialties..."
          value={searchText}
          onChangeText={handleSearchChange}
          onClear={handleSearchClear}
        />  
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'map' && styles.activeToggleButton
            ]}
            onPress={() => setSelectedView('map')}
          >
            <LinearGradient
              colors={selectedView === 'map' ? [COLORS.primaryPurple, COLORS.gradientPink] : ['transparent', 'transparent']}
              style={styles.toggleGradient}
            >
              <Text style={[
                styles.toggleText,
                selectedView === 'map' && styles.activeToggleText
              ]}>
                Map View
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'list' && styles.activeToggleButton
            ]}
            onPress={() => setSelectedView('list')}
          >
            <LinearGradient
              colors={selectedView === 'list' ? [COLORS.primaryPurple, COLORS.gradientPink] : ['transparent', 'transparent']}
              style={styles.toggleGradient}
            >
              <Text style={[
                styles.toggleText,
                selectedView === 'list' && styles.activeToggleText
              ]}>
                List View
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Section Title with Results Count */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchText.trim() ? 'Search Results' : 'Nearby Specialists'}
            </Text>
            {searchText.trim() && (
              <Text style={styles.resultsCount}>
                {filteredDoctors.length} result{filteredDoctors.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          
          {/* Doctors List or No Results */}
          <View style={styles.doctorsContainer}>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map(renderDoctorCard)
            ) : searchText.trim() ? (
              renderNoResults()
            ) : (
              doctors.map(renderDoctorCard)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(10),
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10),
    paddingBottom: moderateScale(15),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  filterButton: {
    padding: moderateScale(8),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(15),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
  },
  searchIcon: {
    marginRight: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: moderateScale(14),
    paddingVertical: moderateScale(12),
  },
  viewToggleContainer: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
  },
  toggleButton: {
    flex: 1,
  },
  toggleGradient: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(6),
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  activeToggleText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(100),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  resultsCount: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  doctorsContainer: {
    gap: moderateScale(12),
  },
  doctorCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImageContainer: {
    marginRight: moderateScale(12),
  },
  doctorImagePlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.workoutOption,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(4),
  },
  doctorSpecialty: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
    marginBottom: moderateScale(6),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: moderateScale(6),
  },
  ratingText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  distanceContainer: {
    backgroundColor: COLORS.primaryPurple,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  distanceText: {
    fontSize: moderateScale(11),
    color: COLORS.white,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  noResultsTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  noResultsText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});

export default FindDoctorsScreen;