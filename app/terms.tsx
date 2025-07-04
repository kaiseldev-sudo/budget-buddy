import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Terms and Conditions</Text>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last updated: {new Date().toLocaleDateString()}</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            By accessing and using the Budget Tracker app, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>2. Use License</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            Permission is granted to temporarily download one copy of the app per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Modify or copy the materials</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Use the materials for any commercial purpose</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Attempt to reverse engineer any software contained in the app</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Remove any copyright or other proprietary notations</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>3. User Account</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>4. Data and Privacy</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            Your financial data is stored securely and we are committed to protecting your privacy. Please review our Privacy Policy for details on how we collect, use, and protect your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>5. Disclaimer</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            The materials within the app are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>6. Limitations</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>7. Revisions and Errata</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            The materials appearing in the app could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the app are accurate, complete or current.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>8. Links</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We have not reviewed all of the sites linked to the app and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>9. Modifications</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We may revise these terms of service for the app at any time without notice. By using this app you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>10. Contact Information</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            If you have any questions about these Terms and Conditions, please contact us at support@budgettracker.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 4,
  },
}); 