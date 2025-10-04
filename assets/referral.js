// Referral system
async function processReferral(inviteeId, referralCode) {
    try {
        if (!referralCode) return;

        // Find inviter by referral code
        const { data: inviter, error: inviterError } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', referralCode)
            .single();

        if (inviterError || !inviter) return;

        // Check if referral already processed
        const { data: existingReferral, error: checkError } = await supabase
            .from('referrals')
            .select('*')
            .eq('invitee_id', inviteeId)
            .single();

        if (existingReferral) return;

        // Add referral record
        const { error: referralError } = await supabase
            .from('referrals')
            .insert({
                inviter_id: inviter.id,
                invitee_id: inviteeId,
                bonus_given: false
            });

        if (referralError) throw referralError;

        // Give bonus coins (250 each)
        const inviterUpdated = await updateCoins(inviter.id, 250, 'earn');
        const inviteeUpdated = await updateCoins(inviteeId, 250, 'earn');

        if (inviterUpdated && inviteeUpdated) {
            // Add earning records
            await addEarningRecord(inviter.id, 'referral', 250);
            await addEarningRecord(inviteeId, 'referral', 250);

            // Mark bonus as given
            await supabase
                .from('referrals')
                .update({ bonus_given: true })
                .eq('invitee_id', inviteeId);
        }
    } catch (error) {
        console.error('Referral processing error:', error);
    }
}

async function getReferralStats(userId) {
    try {
        // Get referral count
        const { data: referrals, error: refError } = await supabase
            .from('referrals')
            .select('*')
            .eq('inviter_id', userId);

        if (refError) throw refError;

        // Get referral earnings
        const { data: earnings, error: earnError } = await supabase
            .from('earnings')
            .select('coins')
            .eq('user_id', userId)
            .eq('type', 'referral');

        if (earnError) throw earnError;

        const totalEarnings = earnings.reduce((sum, earning) => sum + earning.coins, 0);

        return {
            totalReferrals: referrals?.length || 0,
            totalEarnings: totalEarnings,
            referrals: referrals || []
        };
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return { totalReferrals: 0, totalEarnings: 0, referrals: [] };
    }
}
