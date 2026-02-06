import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';

const PrivacyPolicyContent = () => {
  const navigate = useNavigate();
  const lastUpdated = 'February 6, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-indigo-950 text-white">
      <div className="sticky top-0 z-10 bg-blue-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 pt-safe">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">NoMo Phone Privacy Policy</h2>
            <p className="text-white/60">Last updated: {lastUpdated}</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Introduction</h3>
            <p className="text-white/80 leading-relaxed">
              NoMo Inc. ("we", "our", or "us") operates the NoMo Phone mobile application (the "App").
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our App. Please read this privacy policy carefully.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Information We Collect</h3>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Account Information</h4>
              <p className="text-white/80 leading-relaxed">
                When you create an account, we may collect your email address and display name to
                provide personalized features and sync your progress across devices.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Usage Data</h4>
              <p className="text-white/80 leading-relaxed">
                We collect information about your focus sessions, including session duration,
                completion status, streaks, and achievements. This data is used to provide the
                core functionality of the App and track your productivity progress.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Screen Time Data</h4>
              <p className="text-white/80 leading-relaxed">
                With your permission, NoMo Phone uses Apple's Screen Time API (Family Controls)
                to monitor when you're away from your device. This allows us to reward you for
                staying focused. This data is processed locally on your device and is not transmitted
                to our servers.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Device Information</h4>
              <p className="text-white/80 leading-relaxed">
                We may collect device identifiers for app functionality, crash reporting,
                and to provide customer support. This information is not used for tracking
                purposes across other apps or websites.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li>To provide and maintain the App's core functionality</li>
              <li>To track and display your focus progress, streaks, and achievements</li>
              <li>To enable cloud sync of your data across devices (if you opt in)</li>
              <li>To send you notifications about your progress (with your permission)</li>
              <li>To process in-app purchases and subscriptions</li>
              <li>To improve and optimize the App experience</li>
              <li>To provide customer support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Data Storage</h3>
            <p className="text-white/80 leading-relaxed">
              Most of your data is stored locally on your device. If you create an account,
              certain data may be synced to our secure servers powered by Supabase to enable
              cross-device functionality. Your Screen Time data never leaves your device.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Data Sharing</h3>
            <p className="text-white/80 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties.
              We may share anonymized, aggregated data for analytics purposes. We may also
              share data with service providers who assist us in operating the App, subject
              to confidentiality obligations.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Third-Party Services</h3>
            <p className="text-white/80 leading-relaxed">
              Our App uses the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li><strong>Supabase:</strong> For user authentication and cloud data storage</li>
              <li><strong>Apple App Store:</strong> For processing in-app purchases</li>
              <li><strong>Apple Screen Time API:</strong> For device activity monitoring (with permission)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Your Rights</h3>
            <p className="text-white/80 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li>Access and export your data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of notifications at any time</li>
              <li>Revoke Screen Time permissions in your device settings</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Children's Privacy</h3>
            <p className="text-white/80 leading-relaxed">
              NoMo Phone is intended for users of all ages. We do not knowingly collect
              personal information from children under 13 without parental consent. If you
              believe we have collected information from a child under 13, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Data Security</h3>
            <p className="text-white/80 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information. However, no method of transmission over the Internet or
              electronic storage is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Changes to This Policy</h3>
            <p className="text-white/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy in the App and updating the "Last updated"
              date at the top.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Contact Us</h3>
            <p className="text-white/80 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-white/5 rounded-lg p-4 space-y-1">
              <p className="text-white font-medium">NoMo Inc.</p>
              <p className="text-white/80">Email: privacy@nomoinc.co</p>
              <p className="text-white/80">Website: https://nomoinc.co</p>
            </div>
          </section>

          <div className="pt-8 pb-16 text-center text-white/40 text-sm">
            &copy; {new Date().getFullYear()} NoMo Inc. All rights reserved.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const PrivacyPolicy = () => (
  <PageErrorBoundary pageName="Privacy Policy">
    <PrivacyPolicyContent />
  </PageErrorBoundary>
);

export default PrivacyPolicy;
