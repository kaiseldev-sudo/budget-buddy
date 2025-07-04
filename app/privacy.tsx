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

export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last updated: {new Date().toLocaleDateString()}</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>1. Information We Collect</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We collect information you provide directly to us, such as when you create an account, add transactions, or contact us for support. This may include:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Personal information (name, email address)</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Financial data (transactions, budgets, categories)</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Device information and usage statistics</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>2. How We Use Your Information</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We use the information we collect to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Provide, maintain, and improve our services</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Process transactions and send related information</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Send technical notices, updates, and support messages</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Respond to your comments and questions</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Monitor and analyze trends and usage</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>3. Information Sharing</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• With your explicit consent</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• To comply with legal obligations</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• To protect our rights and safety</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• In connection with a business transfer</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>4. Data Security</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Encryption of data in transit and at rest</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Regular security assessments</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Access controls and authentication</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Secure data storage practices</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>5. Data Retention</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You may request deletion of your account and associated data at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>6. Your Rights</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            You have the right to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Access your personal information</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Correct inaccurate information</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Request deletion of your data</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Object to processing of your data</Text>
          <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Data portability</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>7. Cookies and Tracking</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We may use cookies and similar tracking technologies to enhance your experience and collect information about how you use our app. You can control cookie settings through your device preferences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>8. Third-Party Services</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            Our app may integrate with third-party services (such as authentication providers). These services have their own privacy policies, and we encourage you to review them.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>9. Children's Privacy</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>10. Changes to This Policy</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>11. Contact Us</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            If you have any questions about this Privacy Policy, please contact us at privacy@budgettracker.com
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