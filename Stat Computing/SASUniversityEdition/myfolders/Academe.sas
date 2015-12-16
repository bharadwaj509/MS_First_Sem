DATA ACADEME;
INFILE "AAUP_data.txt"  delimiter=','; 
length FICE $4;
length College_Name $40;
INPUT FICE College_Name$ State_code$ Type_1$ Avg_Sal_Full_Prof Avg_Sal_Assoc_Prof Avg_Sal_Assistant_Prof Avg_Sal_All_Ranks Avg_Comp_Full_Prof Avg_Comp_Assoc_Prof Avg_Comp_Assis_Prof Avg_Comp_All_Ranks No_Full_Prof No_Assoc_Prof No_Assis_Professors No_Instructors No_Faculty_All_Ranks;
RUN;
PROC PRINT DATA=ACADEME;
RUN;