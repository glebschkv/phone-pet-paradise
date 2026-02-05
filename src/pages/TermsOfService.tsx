import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfService = () => {
  const navigate = useNavigate();
  const lastUpdated = 'November 29, 2024';

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
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">NoMo Phone Terms of Service</h2>
            <p className="text-white/60">Last updated: {lastUpdated}</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">1. Acceptance of Terms</h3>
            <p className="text-white/80 leading-relaxed">
              By downloading, installing, or using NoMo Phone ("the App"), you agree to be bound by
              these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
              NoMo Inc. ("we", "us", or "our") reserves the right to modify these Terms at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">2. Description of Service</h3>
            <p className="text-white/80 leading-relaxed">
              NoMo Phone is a productivity application that helps users reduce phone usage through
              gamification. The App includes features such as focus timers, virtual pet collection,
              achievement systems, and device activity monitoring.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">3. User Accounts</h3>
            <p className="text-white/80 leading-relaxed">
              Some features of the App may require you to create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">4. Subscriptions and Payments</h3>

            <div className="space-y-3">
              <h4 className="font-medium text-white">4.1 Premium Subscriptions</h4>
              <p className="text-white/80 leading-relaxed">
                NoMo Phone offers premium subscription plans that provide access to additional features.
                Subscriptions are billed through Apple's App Store and are subject to Apple's terms and conditions.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">4.2 Billing</h4>
              <p className="text-white/80 leading-relaxed">
                Subscription fees are charged to your Apple ID account at confirmation of purchase.
                Subscriptions automatically renew unless auto-renew is turned off at least 24 hours
                before the end of the current period.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">4.3 Cancellation</h4>
              <p className="text-white/80 leading-relaxed">
                You may cancel your subscription at any time through your Apple ID account settings.
                Cancellation will take effect at the end of the current billing period. No refunds
                will be provided for partial subscription periods.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">4.4 In-App Purchases</h4>
              <p className="text-white/80 leading-relaxed">
                The App may offer in-app purchases for virtual currency and items. All purchases are
                final and non-refundable except as required by applicable law.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">5. Screen Time Access</h3>
            <p className="text-white/80 leading-relaxed">
              The App uses Apple's Screen Time API to monitor device activity. By granting this
              permission, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-4">
              <li>The App will track time spent away from your device</li>
              <li>This data is used to calculate rewards and track progress</li>
              <li>Screen Time data is processed locally and not shared with third parties</li>
              <li>You can revoke this permission at any time in Settings</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">6. Virtual Items and Currency</h3>
            <p className="text-white/80 leading-relaxed">
              The App includes virtual items such as pets, coins, and cosmetics. These items:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-4">
              <li>Have no real-world monetary value</li>
              <li>Cannot be exchanged for real currency</li>
              <li>Are licensed to you, not sold</li>
              <li>May be modified or removed at our discretion</li>
              <li>Are non-transferable between accounts</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">7. User Conduct</h3>
            <p className="text-white/80 leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-4">
              <li>Use the App for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Modify, reverse engineer, or decompile the App</li>
              <li>Use automated systems or bots to interact with the App</li>
              <li>Exploit bugs or glitches to gain unfair advantages</li>
              <li>Harass, abuse, or harm other users (in guild features)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">8. Intellectual Property</h3>
            <p className="text-white/80 leading-relaxed">
              All content in the App, including but not limited to graphics, animations, sounds,
              text, and software, is owned by NoMo Inc. or its licensors and is protected by
              copyright, trademark, and other intellectual property laws. You may not use,
              reproduce, or distribute any content without our express written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">9. Disclaimer of Warranties</h3>
            <p className="text-white/80 leading-relaxed">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED,
              ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">10. Limitation of Liability</h3>
            <p className="text-white/80 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOMO INC. SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF
              OR RELATED TO YOUR USE OF THE APP, INCLUDING BUT NOT LIMITED TO LOSS OF DATA,
              LOSS OF PROFITS, OR BUSINESS INTERRUPTION.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">11. Termination</h3>
            <p className="text-white/80 leading-relaxed">
              We may terminate or suspend your access to the App at any time, with or without
              cause, and with or without notice. Upon termination, your right to use the App
              will immediately cease, and you may lose access to any data associated with
              your account.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">12. Changes to Terms</h3>
            <p className="text-white/80 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of
              any material changes by posting the updated Terms in the App. Your continued
              use of the App after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">13. Governing Law</h3>
            <p className="text-white/80 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of
              the State of Delaware, United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">14. Contact Us</h3>
            <p className="text-white/80 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-white/5 rounded-lg p-4 space-y-1">
              <p className="text-white font-medium">NoMo Inc.</p>
              <p className="text-white/80">Email: support@nomoinc.co</p>
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

export default TermsOfService;
