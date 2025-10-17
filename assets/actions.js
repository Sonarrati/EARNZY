// Earning actions
async function watchAd() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        // Check daily limit (max 50 ads/day)
        const todayEarnings = await checkDailyLimit(user.id, 'watch');
        if (todayEarnings.length >= 50) {
            return { success: false, message: 'Daily limit reached (50 ads)' };
        }

        // Generate random coins between 10-20
        const coins = Math.floor(Math.random() * 11) + 10;

        // Update coins and add earning record
        const coinUpdated = await updateCoins(user.id, coins, 'earn');
        const recordAdded = await addEarningRecord(user.id, 'watch', coins);

        if (coinUpdated && recordAdded) {
            return { success: true, coins: coins };
        } else {
            return { success: false, message: 'Failed to process earning' };
        }
    } catch (error) {
        console.error('Watch ad error:', error);
        return { success: false, message: 'An error occurred' };
    }
}

async function scratchCard() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        // Check daily limit (max 3 scratch cards/day)
        const todayEarnings = await checkDailyLimit(user.id, 'scratch');
        if (todayEarnings.length >= 3) {
            return { success: false, message: 'Daily limit reached (3 scratch cards)' };
        }

        // Generate random coins between 5-50
        const coins = Math.floor(Math.random() * 46) + 5;

        // Update coins and add earning record
        const coinUpdated = await updateCoins(user.id, coins, 'earn');
        const recordAdded = await addEarningRecord(user.id, 'scratch', coins);

        if (coinUpdated && recordAdded) {
            return { success: true, coins: coins };
        } else {
            return { success: false, message: 'Failed to process earning' };
        }
    } catch (error) {
        console.error('Scratch card error:', error);
        return { success: false, message: 'An error occurred' };
    }
}

async function dailyCheckin() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        // Get user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) throw userError;

        const today = new Date().toISOString().split('T')[0];
        const lastCheckin = userData.last_checkin;

        let streak = userData.daily_streak || 0;
        let coins = 0;

        // Check if already checked in today
        if (lastCheckin === today) {
            return { success: false, message: 'Already checked in today' };
        }

        // Calculate streak and coins
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastCheckin === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }

        // Calculate coins based on streak (Day1:10 → Day7:100)
        coins = Math.min(10 + (streak - 1) * 15, 100);

        // Update user data
        const { error: updateError } = await supabase
            .from('users')
            .update({
                daily_streak: streak,
                last_checkin: today
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // Add coins and earning record
        const coinUpdated = await updateCoins(user.id, coins, 'earn');
        const recordAdded = await addEarningRecord(user.id, 'checkin', coins);

        if (coinUpdated && recordAdded) {
            return { success: true, coins: coins, streak: streak };
        } else {
            return { success: false, message: 'Failed to process checkin' };
        }
    } catch (error) {
        console.error('Daily checkin error:', error);
        return { success: false, message: 'An error occurred' };
    }
}

async function openTreasure() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        // Check daily limit (max 1 treasure/day)
        const todayEarnings = await checkDailyLimit(user.id, 'treasure');
        if (todayEarnings.length >= 1) {
            return { success: false, message: 'Daily limit reached (1 treasure)' };
        }

        // Generate random coins between 20-200
        const coins = Math.floor(Math.random() * 181) + 20;

        // Update coins and add earning record
        const coinUpdated = await updateCoins(user.id, coins, 'earn');
        const recordAdded = await addEarningRecord(user.id, 'treasure', coins);

        if (coinUpdated && recordAdded) {
            return { success: true, coins: coins };
        } else {
            return { success: false, message: 'Failed to process treasure' };
        }
    } catch (error) {
        console.error('Treasure error:', error);
        return { success: false, message: 'An error occurred' };
    }
}

// Task-related functions
async function completeTask(taskId, reward) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        // Check if task already completed today
        const today = new Date().toISOString().split('T')[0];
        const { data: existing, error: checkError } = await supabase
            .from('user_tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('task_id', taskId)
            .gte('completed_at', today)
            .single();

        if (existing) {
            return { success: false, message: 'Task already completed today' };
        }

        // Update user coins and add task record
        const coinUpdated = await updateCoins(user.id, reward, 'task');
        const taskRecorded = await addTaskRecord(user.id, taskId, reward);

        if (coinUpdated && taskRecorded) {
            return { success: true, coins: reward };
        } else {
            return { success: false, message: 'Failed to complete task' };
        }
    } catch (error) {
        console.error('Complete task error:', error);
        return { success: false, message: 'An error occurred' };
    }
}

async function addTaskRecord(userId, taskId, reward) {
    try {
        const { error } = await supabase
            .from('user_tasks')
            .insert([
                {
                    user_id: userId,
                    task_id: taskId,
                    reward: reward,
                    completed_at: new Date().toISOString()
                }
            ]);

        return !error;
    } catch (error) {
        console.error('Add task record error:', error);
        return false;
    }
}

// Helper functions
async function checkDailyLimit(userId, type) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('earnings')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)
            .gte('created_at', today);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Check daily limit error:', error);
        return [];
    }
}

async function updateCoins(userId, coins, type = 'earn') {
    try {
        // Get current user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        const updateData = {
            total_coins: (userData.total_coins || 0) + coins,
            earned_coins: (userData.earned_coins || 0) + coins,
            updated_at: new Date().toISOString()
        };

        // Add to daily earnings if it's a task
        if (type === 'task') {
            updateData.daily_earnings = (userData.daily_earnings || 0) + coins;
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        return !error;
    } catch (error) {
        console.error('Update coins error:', error);
        return false;
    }
}

async function addEarningRecord(userId, type, coins) {
    try {
        const { error } = await supabase
            .from('earnings')
            .insert([
                {
                    user_id: userId,
                    type: type,
                    coins: coins,
                    created_at: new Date().toISOString()
                }
            ]);

        return !error;
    } catch (error) {
        console.error('Add earning record error:', error);
        return false;
    }
}

// Initialize Supabase
const SUPABASE_URL = 'https://qwoqpwyjugfsiwlwvmlf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b3Fwd3lqdWdmc2l3bHd2bWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzkzNDAsImV4cCI6MjA3NTA1NTM0MH0.36cfavBebNeF4SLuar3jUTRORYnhaOhc6A5xuF4HvLw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
