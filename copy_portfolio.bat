@echo off
echo Copying portfolio images from brand designs...
set SRC=10x brand designs

REM === Main portfolio images ===
copy "%SRC%\ZetuPay\ZetuPay_02.png"                          "website\images\portfolio_zetupay.png"
copy "%SRC%\Gideon\Artboard 1.jpg"                            "website\images\portfolio_gideon.jpg"
copy "%SRC%\GR1Ware\GR1WARE_01.png"                           "website\images\portfolio_gr1ware.png"
copy "%SRC%\arike\Arike-C_01.png"                             "website\images\portfolio_arike.png"
copy "%SRC%\Vale\vale_02.png"                                 "website\images\portfolio_vale.png"

REM === Secondary images (fan-out) ===
copy "%SRC%\ZetuPay\ZetuPay.png"                              "website\images\portfolio_zetupay_2.png"
copy "%SRC%\ZetuPay\ZetuPay_01.png"                           "website\images\portfolio_zetupay_3.png"
copy "%SRC%\Gideon\Artboard 2.jpg"                            "website\images\portfolio_gideon_2.jpg"
copy "%SRC%\Gideon\Artboard 3.jpg"                            "website\images\portfolio_gideon_3.jpg"
copy "%SRC%\GR1Ware\GR1WARE_02.png"                           "website\images\portfolio_gr1ware_2.png"
copy "%SRC%\arike\Arike-C_02.png"                             "website\images\portfolio_arike_2.png"
copy "%SRC%\Vale\vale_01.png"                                 "website\images\portfolio_vale_2.png"

REM === About section image ===
copy "%SRC%\pulse district\Artboard 1 copy@8x-100.jpg"       "website\images\about_section.jpg"

echo.
echo Done! All portfolio images copied.
pause
