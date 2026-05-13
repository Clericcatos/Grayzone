using System;

public class StaffAssignment
{
    public int MaxPeople { get; private set; }
    public int CurrentPeople { get; private set; }

    public int BrokenPercentage { get; private set; }

    private int DibuffStaff { get; set; }

    public int EffectiveMaxPeople => Math.Max(0, MaxPeople - DibuffStaff);


    //생성시 초기값 설정
    public StaffAssignment(int maxPeople)
    {
        MaxPeople = Math.Max(0, maxPeople);
    }

    //투입 인원이 제한을 넘는지 확인
    public bool CanAssign(int currentCount, int amount)
    {
        return amount > 0 && currentCount + amount <= EffectiveMaxPeople;
    }

    //인원 투입 함수
    //public bool TryAssign(int amount)
    //{
    //    if (!CanAssign(amount))
    //    {
    //        //꽉찼다고 알리는 UI 함수 호출 / 콜백 등록
    //        return false;
    //    }

    //    CurrentPeople += amount;
    //    return true;
    //}


    ////인원 방출 함수
    //public bool TryUnassign(int amount)
    //{
    //    if (amount <= 0 || CurrentPeople - amount < 0)
    //        return false;

    //    CurrentPeople -= amount;
    //    return true;
    //}

    //최대 인원 증가 함수 ( 업그레이드 용 )
    public bool TryUpgradeCapacity(int amount)
    {
        if (amount <= 0)
            return false;

        MaxPeople += amount;
        return true;
    }

    public void ShelterBroken(int brokenpercentage)
    {
        if (brokenpercentage < 0) return;
        
        BrokenPercentage = brokenpercentage;
        SetDibuff();
    }

    private void SetDibuff()
    {
        BrokenPercentage = Math.Min(100, BrokenPercentage);

        //TODO : 나중에 퍼센테이지 로직으로 변경 할 수 있음
        switch(BrokenPercentage)
        {
            case int n when (n > 0 && n < 10):
                {
                    DibuffStaff =  1;
                    break;
                }
            case int n when (n > 30 && n < 60):
                {
                    DibuffStaff = 3;
                    break;
                }
            case int n when (n > 60 && n < 100):
                {
                    DibuffStaff = 5;
                    break;
                }
            case 100:
                {
                    DibuffStaff = MaxPeople;
                    break;
                }
            case int n when n <= 0:
                {
                    DibuffStaff = 0;
                    break;
                }
        }
    }

    public void ReleasePeople()
    {
        if (BrokenPercentage <= 0) return;
        if (CurrentPeople <= EffectiveMaxPeople) return;

        CurrentPeople = EffectiveMaxPeople;
        // TODO : 방출된 캐릭터들에게 각자 방출되었다고 알리는 콜백 필요
    }
}
