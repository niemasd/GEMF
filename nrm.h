#ifndef NRMH
#define NRMH


#include "common.h"
/*
 * nrm.h of GEMF in C language
 * Futing Fan
 * Kansas State University
 * Updates by Niema Moshiri (UC San Diego)
 * Last Modified: March 2018
 * Copyright (c) 2016, Futing Fan. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted
 */

//heart beat
typedef struct{
    size_t* count, last_report;
    int count_down, frequency;
    double timer0, timer2, last_report_time;
}Heart_beat;

//compare two Edge or Edge struct
//return 0 if equal
//return 1 if a is greater
//return -1 otherwise
int Edge_cmp( const void *a, const void *b);

//Next reaction method
int nrm(Graph* graph, Transition* tran, Status* sts, Run* run);

//weighted random draw from a double array
size_t weighed_rat_rand( double* rat_lst, size_t len);

//get next event according to rate list
int get_next_evt(double* p_raw_rat_lst, double** p_inducer_cal_lst, Graph* graph, Transition* tran, Status* sts, Event *evt, Heap* heap);

#endif

