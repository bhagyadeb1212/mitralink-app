import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import useStore from '../store';
import { Smartphone, ShieldCheck, User, ArrowRight, ChevronLeft, Search } from 'lucide-react-native';
import { countries, Country } from '../constants/countries';

export default function LoginScreen() {
    const [step, setStep] = useState(1); // 1: Phone, 3: Name
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country>(
        countries.find(c => c.code === '+91') || countries[0]
    );
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [tempAuth, setTempAuth] = useState<{ token: string, user: any } | null>(null);

    const { login, updateProfile, setAuth } = useStore();
    const router = useRouter();

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.includes(searchQuery)
    );

    const handleLogin = async () => {
        if (!phoneNumber || phoneNumber.length < 3) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        const fullPhone = `${selectedCountry.code}${phoneNumber}`;
        setIsLoading(true);
        const result = await login(fullPhone);
        setIsLoading(false);

        if (result.success && result.token && result.user) {
            if (result.isNewUser || !result.user.username) {
                setTempAuth({ token: result.token, user: result.user });
                setStep(3);
            } else {
                await setAuth(result.token, result.user);
                router.replace('/(tabs)');
            }
        } else {
            Alert.alert('Error', result.error || 'Failed to login');
        }
    };

    const handleSetProfile = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter your profile name');
            return;
        }

        if (!tempAuth) return;

        setIsLoading(true);
        const success = await updateProfile(username.trim(), tempAuth.token);
        setIsLoading(false);

        if (success) {
            const updatedUser = { ...tempAuth.user, username: username.trim() };
            await setAuth(tempAuth.token, updatedUser);
            router.replace('/(tabs)');
        } else {
            Alert.alert('Error', 'Failed to update profile. Redirecting anyway...');
            await setAuth(tempAuth.token, tempAuth.user);
            router.replace('/(tabs)');
        }
    };

    const reset = () => {
        setStep(1);
        setTempAuth(null);
    };

    const renderCountryItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => {
                setSelectedCountry(item);
                setIsCountryModalVisible(false);
                setSearchQuery('');
            }}
        >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryCode}>{item.code}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.glass}>
                {step === 3 && (
                    <TouchableOpacity onPress={reset} style={styles.backButton}>
                        <ChevronLeft size={24} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                <Text style={styles.title}>
                    MitraLink
                </Text>
                <Text style={styles.subtitle}>
                    {step === 1 ? "Enter your phone number to continue" : "Setup your profile name"}
                </Text>

                {step === 1 && (
                    <View style={styles.inputGroup}>
                        <TouchableOpacity
                            style={styles.countrySelector}
                            onPress={() => setIsCountryModalVisible(true)}
                        >
                            <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
                            <Text style={styles.selectedCode}>{selectedCountry.code}</Text>
                        </TouchableOpacity>

                        <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor="#64748b"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.inputContainer}>
                        <User size={20} color="#94a3b8" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            placeholderTextColor="#64748b"
                            value={username}
                            onChangeText={setUsername}
                            autoFocus
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={step === 1 ? handleLogin : handleSetProfile}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>
                                {step === 1 ? "Continue" : "Finish Setup"}
                            </Text>
                            <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                visible={isCountryModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCountryModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search country..."
                                placeholderTextColor="#64748b"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={false}
                            />
                        </View>

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.name + item.code}
                            renderItem={renderCountryItem}
                            style={styles.countryList}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        padding: 20,
    },
    glass: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 24,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedFlag: {
        fontSize: 20,
        marginRight: 8,
    },
    selectedCode: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 18,
    },
    button: {
        backgroundColor: '#0062E3',
        borderRadius: 16,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#0062E3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    devOtp: {
        color: '#0062E3',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    devButtonsContainer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    devLabel: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 10,
        textAlign: 'center',
    },
    devButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    devButton: {
        width: '18%',
        backgroundColor: 'rgba(0, 98, 227, 0.2)',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 98, 227, 0.4)',
        alignItems: 'center',
    },
    devButtonText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '500',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    closeText: {
        color: '#0062E3',
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    countryList: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 16,
    },
    countryName: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    countryCode: {
        color: '#94a3b8',
        fontSize: 16,
    }
});
