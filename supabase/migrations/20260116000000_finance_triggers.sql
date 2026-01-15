-- Trigger to update money_accounts balance on transaction events

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.from_account_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.to_account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.from_account_id;
            
            UPDATE public.money_accounts
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.to_account_id;
        END IF;
        RETURN NEW;
    
    -- Handle DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.from_account_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.to_account_id;
         ELSIF OLD.type = 'transfer' THEN
            UPDATE public.money_accounts
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.from_account_id;
            
            UPDATE public.money_accounts
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.to_account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE PROCEDURE public.update_account_balance();

-- Function to Ensure a Default Wallet Exists for the user
CREATE OR REPLACE FUNCTION public.ensure_default_wallet(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
    wallet_id UUID;
BEGIN
    SELECT id INTO wallet_id FROM public.money_accounts 
    WHERE user_id = target_user_id AND type = 'cash' LIMIT 1;

    IF wallet_id IS NULL THEN
        INSERT INTO public.money_accounts (user_id, name, type, opening_balance, current_balance)
        VALUES (target_user_id, 'Cash Wallet', 'cash', 0, 0)
        RETURNING id INTO wallet_id;
    END IF;

    RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
