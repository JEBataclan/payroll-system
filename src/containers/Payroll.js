import axios from "axios";
import React, { useState, useEffect, createRef } from "react";
import { connect } from "react-redux";
import jsPDF from "jspdf";
import { CSVReader } from "react-papaparse";
import { CSVLink } from "react-csv";
import { Button, Paper } from "@material-ui/core";

import Table from "../components/Table";
import TransitionsModal from "../components/Modal";

const Payroll = ({ userToken }) => {
  const formData = new FormData();
  let [csvObj, setcsvObj] = useState();
  const [payrollData, setPayrollData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const regulars = [];
  const [filterFn] = useState({
    fn: (items) => {
      return items;
    },
  });
  const whenPostingToOurAPI = (csv) => {
    setIsFetching(true);
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${userToken}`,
      },
    };
    axios
      .post(`https://tup-payroll.herokuapp.com/api/payroll`, csv, config)
      .then((response) => {
        console.log(response);
        setPayrollData(response.data);
        setIsFetching(false);
      })
      .catch((error) => {
        setIsFetching(false);
        console.log(error.response.data);
      });
  };

  const payroll = () => {
    setIsFetching(true);
    axios
      .get("https://tup-payroll.herokuapp.com/api/payroll")
      .then((respond) => {
        setPayrollData(respond.data);
        setIsFetching(false);
      })
      .catch((error) => {
        setIsFetching(false);
        console.log(error);
      });
  };

  useEffect(() => {
    payroll();
  }, []);

  //Put the regular employee to regulars[]
  for (let x of payrollData) {
    if (x.employee !== null) {
      if (x.employee.isPartTime === false) {
        regulars.push(x);
      }
    }
  }

  const overloadColumnHeads = [
    {
      id: "id",
      label: "Employee ID",
      disableSorting: true,
    },
    {
      id: "employeeName",
      label: "Name",
    },
    {
      id: "positions",
      label: "Position",
    },
    {
      id: "monthOverload",
      label: "No. of Hours",
    },
    {
      id: "rates",
      label: "Rate",
    },
    {
      id: "amount",
      label: "Amount",
    },
    {
      id: "withTax",
      label: "w/Tax",
    },
    {
      id: "overloadNetAmount",
      label: "Net Amount",
    },
  ];

  const regularColumnHeads = [
    {
      id: "id",
      label: "Employee ID",
      disableSorting: true,
    },
    {
      id: "employeeName",
      label: "Name",
    },
    {
      id: "positions",
      label: "Position",
    },
    {
      id: "grossAmount",
      label: "Gross Amount",
    },
    {
      id: "withholdingTax",
      label: "With Holding Tax",
    },
    {
      id: "totalDeductions",
      label: "Total Deduction/s",
    },
    {
      id: "regularNetAmount",
      label: "Net Amount",
    },
    {
      id: "printables",
      label: "Printables",
      disableSorting: true,
    },
  ];

  function handlePayslip(key, isPartTime) {
    const pdf = new jsPDF("a6");
    console.log(payrollData);

    let data;
    if (!isPartTime) {
      data = regulars;
    } else {
      data = payrollData;
    }

    let date = data[key].period;
    // START OF PDF FILE
    // HEADER
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.text("TUP MANILA", 90, 10);
    pdf.text("PAYROLL PAYMENT SLIP", 75, 15);
    pdf.text(`For the period of ${date}`, 70, 20);
    pdf.setFontSize(12);
    pdf.setFont("times", "normal");

    // BODY
    pdf.setFontSize(10);

    // RENDERS EMPLOYEE ID
    pdf.text("Employee No.", 10, 50);
    pdf.setFont("times", "bold");
    pdf.text(data[key].employee.employeeId, 40, 50);
    pdf.setFont("times", "normal");

    // RENDERS POSITION
    pdf.text("Position: ", 100, 50);
    pdf.setFont("times", "bold");
    pdf.text(data[key].employee.position.title, 115, 50);
    pdf.setFont("times", "normal");

    // RENDERS EMPLOYEE NAME
    pdf.text("Employee Name:", 10, 55);
    pdf.setFont("times", "bold");
    pdf.text(
      `${data[key].employee.firstName} ${data[key].employee.lastName}`,
      40,
      55
    );
    pdf.setFont("times", "normal");

    // RENDERS GROSS PAY
    pdf.text("Gross Amount Due ", 10, 70);

    pdf.line(175, 65, 200, 65);
    pdf.setFont("times", "bold");
    pdf.text(`${data[key].grossAmount.toFixed(2)}`, 185, 70); //Int values needs to be renders as string in jsPDF
    pdf.setFont("times", "normal");
    pdf.line(175, 73, 200, 73);

    // RENDERS DEDUCTION
    pdf.text("Total Deductions ", 140, 83);
    pdf.setFont("times", "bold");
    // pdf.text(`${data[key].overloadNetAmount}`, 185, 83); //Int values needs to be renders as string in jsPDF
    pdf.text(`${data[key].totalDeductions.toFixed(2)}`, 185, 83);
    pdf.setFont("times", "normal");

    pdf.line(140, 85, 200, 85);

    // RENDERS NET PAY
    pdf.text("Net Amount ", 140, 90);
    pdf.setFont("times", "bold");
    pdf.text(`${data[key].regularNetAmount.toFixed(2)}`, 185, 90); //Int values needs to be renders as string in jsPDF
    pdf.setFont("times", "normal");

    // FOOTER
    pdf.setFontSize(12);
    pdf.setFont("times", "bold");

    pdf.text("Prepared by: ", 10, 105);
    pdf.text("Certified correct: ", 100, 105);

    pdf.text("CATALINA M. BAQUIRAN ", 40, 125);
    pdf.text("Administrative Officer IV ", 43, 130);

    pdf.text("ATTY. CHRISTOPHER M. MORTEL ", 130, 125);
    pdf.text("Head, HRMS ", 155, 130);

    // END OF PDF FILE
    pdf.save("payroll"); //Prints the pdf
  }

  let csvData = payrollData.map((obj) => ({
    employeeId: '=""' + obj.employee.employeeId + '""',
    firstName: obj.employee.firstName,
    lastName: obj.employee.lastName,
    position: obj.employee.position.title,
    monthOverload: obj.monthOverload,
    rate: obj.employee.position.rate,
    amount: obj.amount,
    withTax: obj.withTax,
    netAmount: obj.overloadNetAmount,
  }));

  const handleOpen = () => {
    setIsModalOpen(true);
  };
  const handleClose = () => {
    setIsModalOpen(false);
    setcsvObj();
  };

  const handleFile = (e) => {
    csvObj = e.target.files[0];
    console.log(csvObj);
  };

  const addImport = () => {
    if (!csvObj) {
      console.log("Select file first.");
    } else {
      formData.append("file", csvObj);
      whenPostingToOurAPI(formData);
    }
  };

  // console.log("Regulars: ", regulars);
  // console.log("Overload: ", payrollData);

  return (
    <div style={{ textAlign: "center" }}>
      <Button
        size="large"
        variant="outlined"
        component="span"
        onClick={handleOpen}
      >
        Generate Payroll
      </Button>

      <Button>
        <CSVLink
          data={csvData}
          filename={"overload.csv"}
          className="btn btn-primary"
          target="_blank"
        >
          Export Overload CSV
        </CSVLink>
      </Button>

      <h1>OVERLOAD</h1>
      <Paper>
        <Table
          lists={payrollData}
          filterFn={filterFn}
          columns={overloadColumnHeads}
          propertiesOrder={overloadColumnHeads
            .slice(0, 8)
            .map((item) => item.id)}
          isPayroll={true}
          isLoading={isFetching}
          isOverload={true}
          printPayslip={handlePayslip} //Generate PDF functions
        />
      </Paper>

      <h1>REGULARS</h1>
      <Paper>
        <Table
          lists={regulars}
          filterFn={filterFn}
          columns={regularColumnHeads}
          propertiesOrder={regularColumnHeads
            .slice(0, 7)
            .map((item) => item.id)}
          isPayroll={true}
          isLoading={isFetching}
          printPayslip={handlePayslip} //Generate PDF functions
        />
      </Paper>
      <TransitionsModal
        handleClose={handleClose}
        isModalOpen={isModalOpen}
        title="/ Select File"
      >
        <center>
          <form>
            <input
              type="file"
              name="file"
              onChange={(e) => handleFile(e)}
            ></input>
          </form>

          <div>
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={addImport}
            >
              Add
            </Button>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </center>
      </TransitionsModal>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    userToken: state.auth.token,
  };
};

export default connect(mapStateToProps)(Payroll);
